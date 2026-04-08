import {spawn} from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {createInterface} from 'node:readline';
import {z} from 'zod';
import {tool, type UIToolInvocation} from 'ai';
import {isBlockedDevicePath, isUNCPath} from '../../path-guards.js';
import {applyHeadLimit, getPreStatLimit} from '../../utils/head-limit.js';
import {getGrepSearchDescription} from './prompt.js';

const VCS_DIRECTORIES_TO_EXCLUDE = [
	'.git',
	'.svn',
	'.hg',
	'.bzr',
	'.jj',
	'.sl',
];
const EXCLUDED_DIRECTORIES = [
	'node_modules',
	'dist',
	'build',
	'.next',
	'.cache',
];

type RipgrepTextField = {
	text?: string;
	bytes?: string;
};

type RipgrepOutputRecord = {
	type: 'begin' | 'match' | 'context' | 'end' | 'summary';
	data?: {
		path?: RipgrepTextField;
		lines?: RipgrepTextField;
		line_number?: number | undefined;
		submatches?: unknown[];
	};
};

type ParsedRipgrepRecord = {
	type: 'match' | 'context';
	filePath: string;
	lineNumber: number | undefined;
	text: string;
	submatchCount: number;
};

type RipgrepRunResult = {
	exitCode: number | null;
	signal: NodeJS.Signals | null;
	stderr: string;
	stoppedEarly: boolean;
};

const RIPGREP_TIMEOUT_MS = 30_000;
const RIPGREP_STDERR_LIMIT = 32_000;

function formatLimitInfo(
	appliedLimit: number | undefined,
	appliedOffset: number | undefined,
): string {
	const parts: string[] = [];
	if (appliedLimit !== undefined) {
		parts.push(`limit: ${appliedLimit}`);
	}

	if (appliedOffset) {
		parts.push(`offset: ${appliedOffset}`);
	}

	return parts.join(', ');
}

class RipgrepSpawnError extends Error {
	code?: string;
	path?: string;

	constructor(error: NodeJS.ErrnoException) {
		super(error.message);
		this.name = 'RipgrepSpawnError';
		this.code = error.code;
		this.path = error.path;
	}
}

function appendBoundedText(current: string, chunk: string, limit: number): string {
	if (current.length >= limit) {
		return current;
	}

	const remaining = limit - current.length;
	if (chunk.length <= remaining) {
		return current + chunk;
	}

	return current + chunk.slice(0, remaining);
}

async function runRipgrep(args: string[], options: {
	cwd?: string;
	onStdoutLine?: (line: string, controls: {stop: () => void}) => void;
}): Promise<RipgrepRunResult> {
	return new Promise((resolve, reject) => {
		const child = spawn('rg', args, {
			cwd: options.cwd,
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		const stdoutReader = createInterface({
			input: child.stdout,
			crlfDelay: Number.POSITIVE_INFINITY,
		});
		let settled = false;
		let timedOut = false;
		let stoppedEarly = false;
		let stderr = '';

		const finish = (callback: () => void) => {
			if (settled) {
				return;
			}

			settled = true;
			clearTimeout(timeoutId);
			stdoutReader.close();
			callback();
		};

		const stop = () => {
			if (stoppedEarly) {
				return;
			}

			stoppedEarly = true;
			child.kill('SIGTERM');
		};

		stdoutReader.on('line', line => {
			options.onStdoutLine?.(line, {stop});
		});

		child.stderr.setEncoding('utf8');
		child.stderr.on('data', (chunk: string) => {
			stderr = appendBoundedText(stderr, chunk, RIPGREP_STDERR_LIMIT);
		});

		child.on('error', error => {
			finish(() => reject(new RipgrepSpawnError(error)));
		});

		child.on('close', (exitCode, signal) => {
			finish(() => {
				if (timedOut) {
					reject(
						new Error(
							`ripgrep timed out after ${RIPGREP_TIMEOUT_MS / 1000} seconds`,
						),
					);
					return;
				}

				resolve({
					exitCode,
					signal,
					stderr: stderr.trimEnd(),
					stoppedEarly,
				});
			});
		});

		const timeoutId = setTimeout(() => {
			timedOut = true;
			child.kill('SIGTERM');
		}, RIPGREP_TIMEOUT_MS);
		timeoutId.unref();
	});
}

function ensureRipgrepSucceeded(result: RipgrepRunResult): void {
	if (result.stoppedEarly) {
		return;
	}

	if (result.exitCode === 0 || result.exitCode === 1) {
		return;
	}

	throw new Error(
		result.stderr || `ripgrep exited with code ${String(result.exitCode)}`,
	);
}

function decodeRipgrepText(field: RipgrepTextField | undefined): string {
	if (typeof field?.text === 'string') {
		return field.text;
	}

	if (typeof field?.bytes === 'string') {
		return Buffer.from(field.bytes, 'base64').toString('utf8');
	}

	return '';
}

function parseRipgrepRecords(stdout: string): ParsedRipgrepRecord[] {
	const records: ParsedRipgrepRecord[] = [];

	for (const rawLine of stdout.split('\n')) {
		if (!rawLine.trim()) {
			continue;
		}

		let message: RipgrepOutputRecord;
		try {
			message = JSON.parse(rawLine) as RipgrepOutputRecord;
		} catch {
			continue;
		}

		if (message.type !== 'match' && message.type !== 'context') {
			continue;
		}

		const filePath = decodeRipgrepText(message.data?.path);
		if (!filePath) {
			continue;
		}

		records.push({
			type: message.type,
			filePath,
			lineNumber:
				typeof message.data?.line_number === 'number'
					? message.data.line_number
					: undefined,
			text: decodeRipgrepText(message.data?.lines),
			submatchCount: Array.isArray(message.data?.submatches)
				? message.data.submatches.length
				: 0,
		});
	}

	return records;
}

function formatRipgrepLine(
	record: ParsedRipgrepRecord,
	showLineNumbers: boolean,
): string[] {
	const displayPath = record.filePath;
	const trimmedText = record.text.replace(/[\r\n]+$/, '');
	const lineTexts =
		trimmedText === '' ? [''] : trimmedText.split(/\r\n|\n|\r/g);

	return lineTexts.map(lineText => {
		if (
			showLineNumbers &&
			record.lineNumber !== undefined &&
			record.lineNumber !== null
		) {
			return `${displayPath}:${record.lineNumber}:${lineText}`;
		}

		return `${displayPath}:${lineText}`;
	});
}

function searchPathError(targetPath: string, kind: 'unc' | 'device') {
	if (kind === 'unc') {
		return `Cannot search UNC path: ${targetPath}. Use a local path instead.`;
	}

	return `Cannot search device path: ${targetPath}. This path would block or produce infinite output.`;
}

export const grepSearch = tool({
	description: getGrepSearchDescription(),
	inputSchema: z.object({
		pattern: z
			.string()
			.trim()
			.min(1, 'pattern cannot be blank')
			.describe(
				'The regular expression pattern to search for in file contents',
			),
		path: z
			.string()
			.optional()
			.describe(
				'Absolute file or directory path to search in. If omitted, the current working directory absolute path is used. Relative inputs are resolved for compatibility but should not be used intentionally.',
			),
		searchPath: z
			.string()
			.optional()
			.describe(
				'Deprecated alias for path. Use an absolute file or directory path. Relative inputs are resolved for compatibility but should not be used intentionally.',
			),
		glob: z
			.string()
			.optional()
			.describe(
				'Glob pattern to filter files (e.g. "*.js", "*.{ts,tsx}") - maps to rg --glob',
			),
		includes: z
			.array(z.string())
			.optional()
			.describe(
				'Glob patterns to filter files (e.g. ["*.ts", "*.tsx"]). Alias for glob.',
			),
		outputMode: z
			.enum(['content', 'files_with_matches', 'count'])
			.optional()
			.describe(
				'Output mode: "content" shows matching lines with context, "files_with_matches" shows only file paths (default), "count" shows total matches per file',
			),
		contextBefore: z
			.number()
			.int()
			.nonnegative()
			.optional()
			.describe(
				'Number of lines to show before each match (rg -B). Requires outputMode: "content", ignored otherwise.',
			),
		contextAfter: z
			.number()
			.int()
			.nonnegative()
			.optional()
			.describe(
				'Number of lines to show after each match (rg -A). Requires outputMode: "content", ignored otherwise.',
			),
		context: z
			.number()
			.int()
			.nonnegative()
			.optional()
			.describe(
				'Number of lines to show before and after each match (rg -C). Requires outputMode: "content", ignored otherwise.',
			),
		showLineNumbers: z
			.boolean()
			.optional()
			.describe(
				'Show line numbers in output (derived from rg JSON output). Requires outputMode: "content", ignored otherwise. Defaults to true.',
			),
		caseSensitive: z
			.boolean()
			.optional()
			.describe(
				'Case sensitive search (default: true). Set to false for case-insensitive search with -i',
			),
		fixedStrings: z
			.boolean()
			.optional()
			.describe('Treat pattern as literal string instead of regex (rg -F)'),
		type: z
			.string()
			.optional()
			.describe(
				'File type to search (rg --type). Common types: js, ts, py, rust, go, java, etc. More efficient than glob for standard file types.',
			),
		headLimit: z
			.number()
			.int()
			.nonnegative()
			.optional()
			.describe(
				'Limit output to first N lines/entries. Works across all output modes. Defaults to 250. Pass 0 for unlimited.',
			),
		offset: z
			.number()
			.int()
			.nonnegative()
			.optional()
			.describe(
				'Skip first N lines/entries before applying headLimit. Works across all output modes. Defaults to 0.',
			),
		multiline: z
			.boolean()
			.optional()
			.describe(
				'Enable multiline mode where . matches newlines and patterns can span lines (rg -U --multiline-dotall). Default: false.',
			),
	}),
	async execute({
		pattern,
		path: inputPath,
		searchPath,
		glob,
		includes,
		outputMode = 'files_with_matches',
		contextBefore,
		contextAfter,
		context,
		showLineNumbers = true,
		caseSensitive,
		fixedStrings,
		type,
		headLimit,
		offset = 0,
		multiline,
	}) {
		try {
			pattern = pattern.trim();
			if (pattern === '') {
				throw new Error('pattern cannot be blank');
			}

			const targetPath = inputPath ?? searchPath;
			const resolved = targetPath ? path.resolve(targetPath) : process.cwd();

			if ((targetPath && isUNCPath(targetPath)) || isUNCPath(resolved)) {
				return {error: searchPathError(targetPath ?? resolved, 'unc')};
			}

			if (
				(targetPath && (await isBlockedDevicePath(targetPath))) ||
				(await isBlockedDevicePath(resolved))
			) {
				return {error: searchPathError(targetPath ?? resolved, 'device')};
			}

			try {
				const stats = await fs.stat(resolved);
				if (!stats.isDirectory() && !stats.isFile()) {
					return {
						error: `Path is not a file or directory: ${targetPath ?? resolved}`,
					};
				}
			} catch (error: unknown) {
				const errorRecord = error as {code?: string};
				if (errorRecord.code === 'ENOENT') {
					return {
						error: `Path does not exist: ${
							targetPath ?? resolved
						}. Current working directory: ${process.cwd()}.`,
					};
				}

				throw error instanceof Error ? error : new Error(String(error));
			}

			const args: string[] = ['--hidden'];

			for (const dir of VCS_DIRECTORIES_TO_EXCLUDE) {
				args.push('--glob', `!${dir}`);
			}

			for (const dir of EXCLUDED_DIRECTORIES) {
				args.push('--glob', `!${dir}`);
			}

			args.push('--max-columns', '500');

			if (multiline) {
				args.push('-U', '--multiline-dotall');
			}

			if (fixedStrings) {
				args.push('-F');
			}

			if (caseSensitive === false) {
				args.push('-i');
			}

			if (outputMode === 'files_with_matches') {
				args.push('-l');
			} else if (outputMode === 'count') {
				args.push('--count-matches', '--with-filename');
			} else {
				args.push('--json');
			}

			if (outputMode === 'content') {
				if (context !== undefined) {
					args.push('-C', context.toString());
				} else {
					if (contextBefore !== undefined) {
						args.push('-B', contextBefore.toString());
					}

					if (contextAfter !== undefined) {
						args.push('-A', contextAfter.toString());
					}
				}
			}

			if (type) {
				args.push('--type', type);
			}

			const globPatterns = [
				...(glob?.trim() ? [glob.trim()] : []),
				...(includes ?? []),
			].filter(Boolean);
			for (const globPattern of globPatterns) {
				args.push('--glob', globPattern);
			}

			if (pattern.startsWith('-')) {
				args.push('-e', pattern);
			} else {
				args.push(pattern);
			}

			args.push(resolved);

			if (outputMode === 'content') {
				const collectionLimit = getPreStatLimit(headLimit, offset);
				const maxCollectedLines =
					collectionLimit === undefined ? undefined : collectionLimit + 1;
				const formattedLines: string[] = [];
				let totalMatchCount = 0;

				const ripgrepResult = await runRipgrep(args, {
					onStdoutLine: (line, controls) => {
						if (!line.trim()) {
							return;
						}

						const records = parseRipgrepRecords(line);
						for (const record of records) {
							if (record.type === 'match') {
								totalMatchCount += record.submatchCount;
							}

							formattedLines.push(
								...formatRipgrepLine(record, showLineNumbers),
							);

							if (
								maxCollectedLines !== undefined &&
								formattedLines.length >= maxCollectedLines
							) {
								controls.stop();
								return;
							}
						}
					},
				});
				ensureRipgrepSucceeded(ripgrepResult);
				const {
					items: limitedLines,
					appliedLimit,
					wasTruncated,
				} = applyHeadLimit(formattedLines, headLimit, offset);
				const limitInfo = formatLimitInfo(
					appliedLimit,
					offset > 0 ? offset : undefined,
				);

				return {
					pattern,
					path: resolved,
					outputMode,
					matchCount: totalMatchCount,
					matches: limitedLines,
					truncated: wasTruncated || ripgrepResult.stoppedEarly,
					content: limitedLines.join('\n') || 'No matches found',
					numLines: limitedLines.length,
					...(appliedLimit !== undefined && {appliedLimit}),
					...(offset > 0 && {appliedOffset: offset}),
					...(limitInfo && {paginationInfo: limitInfo}),
				};
			}

			if (outputMode === 'count') {
				const countsByFile = new Map<string, number>();
				const ripgrepResult = await runRipgrep(args, {
					onStdoutLine: line => {
						const separator = line.lastIndexOf(':');
						if (separator <= 0) {
							return;
						}

						const filePath = line.slice(0, separator);
						const countText = line.slice(separator + 1).trim();
						const totalMatchesForFile = Number.parseInt(countText, 10);
						if (!Number.isFinite(totalMatchesForFile)) {
							return;
						}

						countsByFile.set(filePath, totalMatchesForFile);
					},
				});
				ensureRipgrepSucceeded(ripgrepResult);

				const countLines = [...countsByFile].map(
					([filePath, totalMatchesForFile]) =>
						`${filePath}:${totalMatchesForFile}`,
				);
				const {
					items: limitedLines,
					appliedLimit,
					wasTruncated,
				} = applyHeadLimit(countLines, headLimit, offset);
				const totalMatches = [...countsByFile.values()].reduce(
					(sum, count) => sum + count,
					0,
				);
				const limitInfo = formatLimitInfo(
					appliedLimit,
					offset > 0 ? offset : undefined,
				);

				return {
					pattern,
					path: resolved,
					outputMode,
					numFiles: countsByFile.size,
					numMatches: totalMatches,
					matchCount: totalMatches,
					matches: limitedLines,
					truncated: wasTruncated,
					content: limitedLines.join('\n') || 'No matches found',
					...(appliedLimit !== undefined && {appliedLimit}),
					...(offset > 0 && {appliedOffset: offset}),
					...(limitInfo && {paginationInfo: limitInfo}),
				};
			}

			const lines: string[] = [];
			const ripgrepResult = await runRipgrep(args, {
				onStdoutLine: line => {
					if (line) {
						lines.push(line);
					}
				},
			});
			ensureRipgrepSucceeded(ripgrepResult);
			const stats = await Promise.allSettled(
				lines.map(async (filePath: string) => fs.stat(filePath)),
			);
			const sortedMatches = lines
				.map((filePath: string, index: number) => {
					const result = stats[index]!;
					const mtimeMs =
						result.status === 'fulfilled' ? (result.value.mtimeMs ?? 0) : 0;
					return {filePath, mtimeMs};
				})
				.sort(
					(
						left: {filePath: string; mtimeMs: number},
						right: {filePath: string; mtimeMs: number},
					) => {
						if (process.env['NODE_ENV'] === 'test') {
							return left.filePath.localeCompare(right.filePath);
						}

						const timeComparison = right.mtimeMs - left.mtimeMs;
						if (timeComparison === 0) {
							return left.filePath.localeCompare(right.filePath);
						}

						return timeComparison;
					},
				)
				.map((item: {filePath: string; mtimeMs: number}) => item.filePath);
			const {
				items: limitedMatches,
				appliedLimit,
				wasTruncated,
			} = applyHeadLimit(
				sortedMatches,
				headLimit,
				offset,
			);
			const absoluteMatches = limitedMatches;
			const limitInfo = formatLimitInfo(
				appliedLimit,
				offset > 0 ? offset : undefined,
			);

			if (sortedMatches.length === 0) {
				return {
					pattern,
					path: resolved,
					outputMode,
					numFiles: 0,
					filenames: [],
					matchCount: 0,
					matches: [],
					truncated: false,
					message: 'No files found',
				};
			}

			return {
				pattern,
				path: resolved,
				outputMode,
				numFiles: lines.length,
				matchCount: lines.length,
				matches: absoluteMatches,
				truncated: wasTruncated,
				filenames: absoluteMatches,
				...(appliedLimit !== undefined && {appliedLimit}),
				...(offset > 0 && {appliedOffset: offset}),
				...(limitInfo && {paginationInfo: limitInfo}),
			};
		} catch (error: unknown) {
			const typedError =
				error instanceof Error
					? error
					: new Error(typeof error === 'string' ? error : String(error));
			const errorRecord = typedError as Error & {
				code?: string;
				path?: string;
			};
			const missingPath =
				typeof errorRecord.path === 'string' ? errorRecord.path : '';
			const missingRg =
				missingPath === 'rg' ||
				missingPath.endsWith(`${path.sep}rg`) ||
				typedError.message.includes('rg');
			if (errorRecord.code === 'ENOENT' && missingRg) {
				return {
					error:
						'ripgrep (rg) is not installed. Please install ripgrep to use the grepSearch tool. See: https://github.com/BurntSushi/ripgrep#installation',
				};
			}

			return {
				error: `Search failed: ${typedError.message}`,
			};
		}
	},
});

export type GrepSearchToolInvocation = UIToolInvocation<typeof grepSearch>;

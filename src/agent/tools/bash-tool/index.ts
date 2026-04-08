import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {tool, type UIToolInvocation} from 'ai';
import {z} from 'zod';
import {execa, type ExecaError} from 'execa';
import treeKill from 'tree-kill';
import {
	defaultTimeoutSeconds,
	getExecuteCommandDescription,
	maxTimeoutSeconds,
} from './prompt';

const DANGEROUS_PATTERNS = [
	/rm\s+(-[a-zA-Z]*)?r[a-zA-Z]*f?\s+\/(?:\S|$)/,
	/rm\s+(-[a-zA-Z]*)?f[a-zA-Z]*r?\s+\/(?:\S|$)/,
	/mkfs/,
	/dd\s+if=/,
	/:\(\)\s*{\s*:\|:&\s*};/, // Fork bomb pattern
	/>\s*\/dev\/sd[a-z]/,
	/chmod\s+(-R\s+)?777\s+\//,
	/chown\s+(-R\s+)?.*\s+\//,
	/wget\s+.*\|\s*(ba)?sh/,
	/curl\s+.*\|\s*(ba)?sh/,
	/fork\s*bomb/i,
	/>(\/etc\/passwd|\/etc\/shadow)/,
];

const DEFAULT_MAX_OUTPUT_CHARS = 12_000;

const SIGTERM = 143;

type ExecaErrorLike = Pick<ExecaError, 'code' | 'exitCode' | 'shortMessage'>;

function isExecaErrorLike(error: unknown): error is ExecaErrorLike {
	if (typeof error !== 'object' || error === null) {
		return false;
	}

	const record = error as Record<string, unknown>;
	return (
		'exitCode' in record || 'shortMessage' in record || 'code' in record
	);
}

export type BashToolCommandClassification =
	| 'read'
	| 'search'
	| 'mutating'
	| 'unknown'
	| 'refused';

/** Working directory invalid or missing — no command was run. */
export type BashToolOutputEarlyError = {
	error: string;
};

export type BashToolOutputBackgroundStarted = {
	command: string;
	cwd: string;
	classification: BashToolCommandClassification;
	background: true;
	pid: number;
	startedAt: number;
	stdout: '';
	stderr: '';
	exitCode?: undefined;
};

export type BashToolOutputBackgroundStartFailed = {
	command: string;
	cwd: string;
	classification: BashToolCommandClassification;
	background: true;
	pid: null;
	startedAt: number;
	stdout: '';
	stderr: string;
	exitCode: 1;
	error: string;
};

export type BashToolOutputForeground = {
	command: string;
	cwd: string;
	classification: BashToolCommandClassification;
	background: false;
	durationMs: number;
	/** Configured maximum runtime for this invocation, in seconds. */
	timeoutSeconds: number;
	timedOut: boolean;
	aborted: boolean;
	stdout: string;
	stderr: string;
	stdoutTruncated: boolean;
	stderrTruncated: boolean;
	exitCode: number;
	signal?: string;
	error?: string;
};

/** Foreground run failed before a duration could be recorded (e.g. spawn error). */
export type BashToolOutputForegroundCaught = {
	command: string;
	cwd: string;
	classification: BashToolCommandClassification;
	background: false;
	stdout: '';
	stderr: '';
	exitCode: number;
	error: string;
};

export type BashToolOutputRefused = {
	command: string;
	cwd: string;
	classification: 'refused';
	background: boolean;
	stdout: '';
	stderr: string;
	exitCode: 1;
	error: string;
};

export type BashToolOutput =
	| BashToolOutputEarlyError
	| BashToolOutputBackgroundStarted
	| BashToolOutputBackgroundStartFailed
	| BashToolOutputForeground
	| BashToolOutputForegroundCaught
	| BashToolOutputRefused;

const READ_ONLY_COMMAND_PATTERNS = [
	/^\s*(pwd|which|whereis|whoami|printenv)\b/i,
	/^\s*(ls|tree|find|fd|stat|wc|head|tail|cat)\b/i,
	/^\s*(grep|rg)\b/i,
	/^\s*git\s+(status|diff|show|log|branch)\b/i,
];

const SEARCH_COMMAND_PATTERNS = [/^\s*(grep|rg|find|fd)\b/i];

/**
 * Classifies a shell command as one of four categories describing its likely effect.
 *
 * @param command - The shell command string to classify.
 * @returns The classification: \`refused\` if it matches known dangerous patterns,
 * \`search\` if the command matches known search patterns, \`read\` if it matches
 * known read-only patterns, \`mutating\` if it contains common file/package/modification
 * tools (e.g., \`mv\`, \`cp\`, \`sed\`, \`python\`, \`npm\`, \`git\`, \`chmod\`),
 * and \`unknown\` if none of the above apply.
 */
function classifyCommand(command: string): BashToolCommandClassification {
	if (isDangerousCommand(command)) {
		return 'refused';
	}

	if (SEARCH_COMMAND_PATTERNS.some(pattern => pattern.test(command))) {
		return 'search';
	}

	if (READ_ONLY_COMMAND_PATTERNS.some(pattern => pattern.test(command))) {
		return 'read';
	}

	return /\b(mv|cp|sed|perl|python|node|npm|pnpm|bun|git|touch|mkdir|chmod|chown)\b/i.test(
		command,
	)
		? 'mutating'
		: 'unknown';
}

function createDangerousCommandRefusal(
	command: string,
	cwd: string,
	background: boolean,
): BashToolOutputRefused {
	const error = `Refusing to run dangerous command: ${command}`;
	return {
		command,
		cwd,
		classification: 'refused',
		background,
		stdout: '',
		stderr: error,
		exitCode: 1,
		error,
	};
}

/**
 * Appends \`chunk\` to \`current\` while ensuring the result does not exceed \`limit\` characters.
 *
 * @param limit - The maximum allowed length of the returned \`text\` in characters.
 * @returns An object with \`text\` containing the concatenated (and possibly truncated) result, and \`truncated\` — \`true\` if part of \`chunk\` was omitted or if \`current\` already met the limit, \`false\` otherwise.
 */
function appendBoundedText(
	current: string,
	chunk: string,
	limit: number,
): {text: string; truncated: boolean} {
	if (current.length >= limit) {
		return {
			text: current,
			truncated: true,
		};
	}

	const remaining = limit - current.length;
	if (chunk.length <= remaining) {
		return {
			text: current + chunk,
			truncated: false,
		};
	}

	return {
		text: current + chunk.slice(0, remaining),
		truncated: true,
	};
}

/**
 * Formats a duration in milliseconds into a human-readable minutes/seconds string.
 *
 * @param ms - Duration in milliseconds
 * @returns The duration as "{minutes}m {seconds}s" when at least one minute, otherwise as "{seconds}s"
 */
function formatDuration(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;

	if (minutes > 0) {
		return `${minutes}m ${remainingSeconds}s`;
	}

	return `${seconds}s`;
}

/**
 * Detects whether a shell command is potentially dangerous.
 *
 * Tests the provided shell command string against the configured dangerous patterns.
 *
 * @param command - The shell command to evaluate
 * @returns \`true\` if the command matches any configured dangerous pattern, \`false\` otherwise.
 */
export function isDangerousCommand(command: string): boolean {
	return DANGEROUS_PATTERNS.some(pattern => pattern.test(command));
}

export const bashTool = tool({
	description: getExecuteCommandDescription(),
	inputSchema: z.object({
		command: z.string().describe('The shell command to execute'),
		cwd: z
			.string()
			.optional()
			.describe(
				'Absolute working directory for the command. If omitted, the current working directory absolute path is used. Relative inputs are resolved for compatibility but should not be used intentionally.',
			),
		timeoutSeconds: z
			.number()
			.int()
			.positive()
			.max(maxTimeoutSeconds)
			.optional()
			.describe(
				`Maximum runtime before the command is terminated, in seconds. Defaults to ${defaultTimeoutSeconds} (${defaultTimeoutSeconds / 60} minutes); maximum ${maxTimeoutSeconds} (${maxTimeoutSeconds / 60} minutes).`,
			),
		maxOutputChars: z
			.number()
			.int()
			.positive()
			.max(200_000)
			.optional()
			.describe(
				'Maximum number of stdout or stderr characters to retain. Defaults to 12000.',
			),
		background: z
			.boolean()
			.optional()
			.describe(
				'If true, start the command in the background and return immediately.',
			),
	}),
	async execute({
		command,
		cwd,
		timeoutSeconds = defaultTimeoutSeconds,
		maxOutputChars = DEFAULT_MAX_OUTPUT_CHARS,
		background = false,
	}): Promise<BashToolOutput> {
		const timeoutMs = timeoutSeconds * 1000;
		const resolvedCwd = cwd ? path.resolve(cwd) : process.cwd();
		const classification = classifyCommand(command);
		if (classification === 'refused' || isDangerousCommand(command)) {
			return createDangerousCommandRefusal(
				command,
				resolvedCwd,
				background,
			);
		}

		try {
			const cwdStat = await fs.stat(resolvedCwd);
			if (!cwdStat.isDirectory()) {
				return {
					error: `Working directory is not a directory: ${resolvedCwd}`,
				};
			}

			const startedAt = Date.now();

			if (background) {
				// For background execution, use execa with detached mode
				const subprocess = execa(command, [], {
					cwd: resolvedCwd,
					shell: true,
					detached: true,
					stdio: 'ignore',
					env: process.env,
					reject: false,
				});

				if (subprocess.pid === undefined) {
					const errorMessage =
						'Failed to start background command: subprocess did not provide a PID.';
					return {
						command,
						cwd: resolvedCwd,
						classification,
						background: true,
						pid: null,
						startedAt,
						stdout: '',
						stderr: errorMessage,
						exitCode: 1,
						error: errorMessage,
					};
				}

				// Unref the subprocess so it doesn't block the event loop
				subprocess.unref?.();

				// Return immediately with PID, don't wait for completion
				return {
					command,
					cwd: resolvedCwd,
					classification,
					background: true,
					pid: subprocess.pid,
					startedAt,
					stdout: '',
					stderr: '',
					exitCode: undefined,
				};
			}

			// Use execa for streaming output; timeouts are handled manually so treeKill
			// can reliably terminate child processes across the whole process tree.
			const execaOptions = {
				cwd: resolvedCwd,
				shell: true,
				env: process.env,
				reject: false, // Never throw, always resolve with result object
				all: true, // Combine stdout and stderr for easier handling
			};

			// For streaming output with bounds, we need to handle it manually
			let stdout = '';
			let stderr = '';
			let stdoutTruncated = false;
			let stderrTruncated = false;
			let timedOut = false;
			let timeoutId: ReturnType<typeof setTimeout> | undefined;
			let killAfterTimeout: ReturnType<typeof setTimeout> | undefined;

			// Use execa with streaming for bounded output
			const subprocess = execa(command, [], {
				...execaOptions,
				buffer: false, // Don't buffer, we'll handle it
			});

			const clearProcessTimers = () => {
				if (timeoutId) {
					clearTimeout(timeoutId);
					timeoutId = undefined;
				}
				if (killAfterTimeout) {
					clearTimeout(killAfterTimeout);
					killAfterTimeout = undefined;
				}
			};

			const getRunningPid = () => {
				if (
					subprocess.pid === undefined ||
					subprocess.exitCode !== null ||
					subprocess.signalCode !== null
				) {
					return undefined;
				}
				return subprocess.pid;
			};

			const timeoutHandler = () => {
				timedOut = true;
				const pid = getRunningPid();
				if (pid === undefined) {
					return;
				}
				treeKill(pid, 'SIGTERM');
				killAfterTimeout = setTimeout(() => {
					killAfterTimeout = undefined;
					const runningPid = getRunningPid();
					if (runningPid !== undefined) {
						treeKill(runningPid, 'SIGKILL');
					}
				}, 5_000);
				killAfterTimeout.unref();
			};

			// Handle timeout manually for better control
			timeoutId = setTimeout(timeoutHandler, timeoutMs);

			// Unref the timeout so it doesn't block the event loop
			timeoutId.unref();

			// Stream stdout with bounds
			subprocess.stdout?.setEncoding('utf8');
			subprocess.stdout?.on('data', (chunk: string) => {
				const result = appendBoundedText(stdout, chunk, maxOutputChars);
				stdout = result.text;
				stdoutTruncated ||= result.truncated;
			});

			// Stream stderr with bounds
			subprocess.stderr?.setEncoding('utf8');
			subprocess.stderr?.on('data', (chunk: string) => {
				const result = appendBoundedText(stderr, chunk, maxOutputChars);
				stderr = result.text;
				stderrTruncated ||= result.truncated;
			});

			let result;
			try {
				// Wait for process to complete
				result = await subprocess;
			} finally {
				clearProcessTimers();
			}

			const exitCode =
				timedOut ? SIGTERM : (result.exitCode ?? 1);

			// Prepend timeout message if timed out
			if (timedOut) {
				stderr = `Command timed out after ${formatDuration(
					timeoutMs,
				)}\n${stderr}`;
			}

			const out: BashToolOutputForeground = {
				command,
				cwd: resolvedCwd,
				classification,
				background: false,
				durationMs: Date.now() - startedAt,
				timeoutSeconds,
				timedOut,
				aborted: false,
				stdout: stdout.trimEnd(),
				stderr: stderr.trimEnd(),
				stdoutTruncated,
				stderrTruncated,
				exitCode,
				signal: result.signal ?? undefined,
			};
			if (result.failed && result.shortMessage) {
				out.error = result.shortMessage;
			}
			return out;
		} catch (error: unknown) {
			const execaError = isExecaErrorLike(error) ? error : undefined;
			const exitCode =
				typeof execaError?.exitCode === 'number'
					? execaError.exitCode
					: execaError?.code === 'ENOENT'
						? 127
						: 1;
			const errorMessage =
				typeof execaError?.shortMessage === 'string'
					? execaError.shortMessage
					: error instanceof Error
						? error.message
						: String(error);

			return {
				command,
				cwd: resolvedCwd,
				classification,
				background: false,
				stdout: '',
				stderr: '',
				exitCode,
				error: errorMessage,
			};
		}
	},
});

export type BashToolInvocation = UIToolInvocation<typeof bashTool>;

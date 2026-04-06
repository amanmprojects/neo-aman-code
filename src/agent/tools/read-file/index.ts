import type { Stats } from "node:fs";
import * as fp from "node:fs/promises";
import * as path from "node:path";
import { tool, type UIToolInvocation } from "ai";
import { z } from "zod";
import { isBlockedDevicePath, isUNCPath } from "../../path-guards";
import {
    isBinaryFile,
    MAX_FILE_SIZE_BYTES,
} from "../file-safety";
import { getReadFileDescription } from "./prompt";

async function findSimilarFiles(
    targetPath: string,
    cwd: string,
): Promise<string | undefined> {
    try {
        const dir = path.dirname(targetPath);
        const targetName = path.basename(targetPath).toLowerCase();

        const dirStat = await fp.stat(dir).catch(() => undefined);
        if (!dirStat?.isDirectory()) return undefined;

        const entries = await fp.readdir(dir, { withFileTypes: true });
        const files = entries
            .filter((entry) => entry.isFile())
            .map((entry) => entry.name);

        const similar = files.filter((f) => {
            const lower = f.toLowerCase();
            return (
                lower !== targetName &&
                (lower.startsWith(targetName) ||
                    targetName.startsWith(lower) ||
                    lower.includes(targetName) ||
                    targetName.includes(lower) ||
                    path.basename(lower, path.extname(lower)) ===
                        path.basename(targetName, path.extname(targetName)))
            );
        });

        if (similar.length > 0) {
            const similarPath = path.join(dir, similar[0]!);
            const relativePath = path.relative(cwd, similarPath);
            if (!relativePath.startsWith("..") && !path.isAbsolute(relativePath)) {
                return relativePath.replaceAll(path.sep, "/");
            }

            return similar[0]!;
        }
    } catch {
        // Ignore errors in suggestion logic
    }

    return undefined;
}

function suggestPathUnderCwd(
    targetPath: string,
    cwd: string,
): string | undefined {
    const relativePath = path.relative(cwd, targetPath);
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        return undefined;
    }

    return relativePath.replaceAll(path.sep, "/");
}

export const readFile = tool({
    description: getReadFileDescription(),
    inputSchema: z.object({
        filePath: z
            .string()
            .describe("Absolute or relative path to the file to read"),
        offset: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe("1-indexed line number to start reading from"),
        limit: z
            .number()
            .int()
            .min(1)
            .optional()
            .describe(
                "Max number of lines to return. With offset, counts from that line; with offset omitted, reads the first N lines.",
            ),
    }),
    // needsApproval: true,
    async execute({ filePath, offset, limit }) {
        const cwd = process.cwd();

        try {
            const resolved = path.resolve(filePath);

            if (isUNCPath(resolved)) {
                return {
                    error: `Cannot read UNC path: ${filePath}. Use a local path instead.`,
                };
            }

            if (await isBlockedDevicePath(resolved)) {
                return {
                    error: `Cannot read device file: ${filePath}. This file would block or produce infinite output.`,
                };
            }

            let stat: Stats;
            try {
                stat = await fp.lstat(resolved);
            } catch (error: unknown) {
                const errorRecord = error as { code?: string };
                if (errorRecord.code === "ENOENT") {
                    let message = `File not found: ${resolved}. Current working directory: ${cwd}.`;

                    const cwdSuggestion = suggestPathUnderCwd(resolved, cwd);
                    if (cwdSuggestion) {
                        message += ` Did you mean ${cwdSuggestion}?`;
                    } else {
                        const similar = await findSimilarFiles(resolved, cwd);
                        if (similar) {
                            message += ` Did you mean ${similar}?`;
                        }
                    }

                    return { error: message };
                }

                throw error instanceof Error ? error : new Error(String(error));
            }

            if (stat.isDirectory()) {
                return { error: `Path is a directory, not a file: ${resolved}` };
            }

            if (stat.isSymbolicLink()) {
                stat = await fp.stat(resolved);
            }

            if (!stat.isFile()) {
                return {
                    error: `Path is not a regular file: ${resolved}. Cannot read special file types.`,
                };
            }

            if (stat.size > MAX_FILE_SIZE_BYTES) {
                return {
                    error: `File is too large (${(stat.size / 1024).toFixed(
                        1,
                    )}KB) to read with this tool. Maximum size is ${
                        MAX_FILE_SIZE_BYTES / 1024
                    }KB. Use a smaller file or inspect it outside the agent.`,
                };
            }

            const isBinary = await isBinaryFile(resolved);
            if (isBinary) {
                return {
                    error: `Cannot read binary file: ${resolved}. This appears to be a binary file.`,
                };
            }

            const raw = await fp.readFile(resolved, "utf8");
            const content = raw.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
            const lines = content.split("\n");
            const totalLines = lines.length;

            if (totalLines === 0 || (totalLines === 1 && lines[0] === "")) {
                return {
                    filePath: resolved,
                    totalLines: 0,
                    startLine: 1,
                    endLine: 0,
                    content:
                        "<system-reminder>Warning: the file exists but the contents are empty.</system-reminder>",
                };
            }

            let startLine = 1;
            let endLine = totalLines;

            if (limit !== undefined && offset === undefined) {
                startLine = 1;
                endLine = Math.min(totalLines, limit);
            } else if (offset !== undefined) {
                startLine = offset;
                if (limit !== undefined) {
                    endLine = Math.min(totalLines, startLine + limit - 1);
                }
            }

            if (startLine > totalLines) {
                return {
                    filePath: resolved,
                    totalLines,
                    startLine,
                    endLine: totalLines,
                    content: `<system-reminder>Warning: the file exists but is shorter than the provided offset (${startLine}). The file has ${totalLines} lines.</system-reminder>`,
                };
            }

            const selectedLines = lines.slice(startLine - 1, endLine);
            const numbered = selectedLines
                .map(
                    (line, i) =>
                        `${String(startLine + i).padStart(6, " ")}│ ${line}`,
                )
                .join("\n");

            return {
                filePath: resolved,
                totalLines,
                startLine,
                endLine,
                content: numbered,
            };
        } catch (error: unknown) {
            const err = error as { code?: string; message?: string };
            if (err.code === "EACCES" || err.code === "EPERM") {
                return { error: `Permission denied: ${filePath}` };
            }

            if (err.code === "EISDIR") {
                return { error: `Path is a directory: ${filePath}` };
            }

            if (err.code === "ENOTDIR") {
                return { error: `Not a directory in path: ${filePath}` };
            }

            if (err.code === "ENAMETOOLONG") {
                return { error: `File path too long: ${filePath}` };
            }

            const msg =
                typeof err.message === "string" ? err.message : String(error);
            return { error: `Failed to read file: ${msg}` };
        }
    },
});

export type ReadFileToolInvocation = UIToolInvocation<typeof readFile>;


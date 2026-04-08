import * as fp from "node:fs/promises";
import * as path from "node:path";
import { tool, type UIToolInvocation } from "ai";
import { z } from "zod";
import { isBlockedDevicePath, isUNCPath } from "../../path-guards";
import { getListDirToolDescription } from "./prompt";

const DEFAULT_LIMIT = 200;

type EntryType = "file" | "directory" | "symlink" | "other";

type DirectoryEntryResult = {
    name: string;
    path: string;
    type: EntryType;
    size: number | undefined;
    children: number | undefined;
};

const ENTRY_PROCESSING_CONCURRENCY = 10;

/**
 * Counts immediate entries (files, directories, symlinks, etc.) within a directory.
 */
async function countChildren(directoryPath: string): Promise<number> {
    const entries = await fp.readdir(directoryPath);
    return entries.length;
}

function getEntryType(
    stat: Awaited<ReturnType<typeof fp.lstat>>,
): EntryType {
    if (stat.isFile()) {
        return "file";
    }

    if (stat.isDirectory()) {
        return "directory";
    }

    if (stat.isSymbolicLink()) {
        return "symlink";
    }

    return "other";
}

async function mapWithConcurrency<T, U>(
    items: T[],
    concurrency: number,
    mapper: (item: T) => Promise<U>,
): Promise<U[]> {
    const results = new Array<U>(items.length);
    let nextIndex = 0;

    async function worker(): Promise<void> {
        while (true) {
            const currentIndex = nextIndex;
            nextIndex += 1;

            if (currentIndex >= items.length) {
                return;
            }

            results[currentIndex] = await mapper(items[currentIndex]!);
        }
    }

    await Promise.all(
        Array.from({ length: Math.min(concurrency, items.length) }, async () =>
            worker(),
        ),
    );

    return results;
}

export const listDir = tool({
    description: getListDirToolDescription(),
    inputSchema: z.object({
        path: z
            .string()
            .optional()
            .describe(
                "Absolute path of the directory to list. If omitted, the current working directory absolute path is used. Relative inputs are resolved for compatibility but should not be used intentionally.",
            ),
        includeHidden: z
            .boolean()
            .optional()
            .describe(
                "Whether to include dotfiles and dot-directories. Defaults to false.",
            ),
        limit: z
            .number()
            .int()
            .positive()
            .max(1000)
            .optional()
            .describe(
                "Maximum number of directory entries to return. Defaults to 200.",
            ),
    }),
    async execute({
        path: inputPath,
        includeHidden = false,
        limit = DEFAULT_LIMIT,
    }) {
        try {
            const resolvedPath = inputPath ? path.resolve(inputPath) : process.cwd();

            if (isUNCPath(resolvedPath)) {
                return {
                    error: `Cannot list UNC path: ${
                        inputPath ?? resolvedPath
                    }. Use a local path instead.`,
                };
            }

            if (await isBlockedDevicePath(resolvedPath)) {
                return {
                    error: `Cannot list device path: ${
                        inputPath ?? resolvedPath
                    }. This path would block or produce infinite output.`,
                };
            }

            const stat = await fp.stat(resolvedPath);

            if (!stat.isDirectory()) {
                return {
                    error: `Path is not a directory: ${inputPath ?? resolvedPath}`,
                };
            }

            const entries = await fp.readdir(resolvedPath, { withFileTypes: true });
            const visibleEntries = entries.filter(
                (entry) => includeHidden || !entry.name.startsWith("."),
            );
            const sortedEntries = visibleEntries.sort((left, right) =>
                left.name.localeCompare(right.name),
            );
            const selectedEntries = sortedEntries.slice(0, limit);

            const results = await mapWithConcurrency(
                selectedEntries,
                ENTRY_PROCESSING_CONCURRENCY,
                async (entry): Promise<DirectoryEntryResult> => {
                    const absoluteEntryPath = path.join(resolvedPath, entry.name);

                    try {
                        const entryStat = await fp.lstat(absoluteEntryPath);
                        const type = getEntryType(entryStat);

                        return {
                            name: entry.name,
                            path: absoluteEntryPath,
                            type,
                            size: type === "file" ? entryStat.size : undefined,
                            children:
                                type === "directory"
                                    ? await countChildren(absoluteEntryPath)
                                    : undefined,
                        };
                    } catch {
                        return {
                            name: entry.name,
                            path: absoluteEntryPath,
                            type: "other",
                            size: undefined,
                            children: undefined,
                        };
                    }
                },
            );

            return {
                path: resolvedPath,
                entries: results,
                count: results.length,
                totalCount: sortedEntries.length,
                truncated: sortedEntries.length > results.length,
            };
        } catch (error: unknown) {
            const errorRecord = error as { code?: string; message?: string };
            if (errorRecord.code === "ENOENT") {
                return {
                    error: `Directory does not exist: ${
                        inputPath ? path.resolve(inputPath) : process.cwd()
                    }`,
                };
            }

            const message =
                typeof errorRecord.message === "string"
                    ? errorRecord.message
                    : String(error);
            return {
                error: `Failed to list directory: ${message}`,
            };
        }
    },
});

export type ListDirToolInvocation = UIToolInvocation<typeof listDir>;

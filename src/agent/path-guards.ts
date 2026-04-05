import * as path from "node:path";

/**
 * Windows-style UNC paths (e.g. `\\server\share`).
 */
export function isUNCPath(filePath: string): boolean {
    if (filePath.startsWith("\\\\")) {
        return true;
    }
    // UNC can appear as //server/share on some APIs
    return /^\/\/[^/]+/.test(filePath);
}

const WINDOWS_RESERVED = new Set([
    "con",
    "prn",
    "aux",
    "nul",
    "clock$",
    "com1",
    "com2",
    "com3",
    "com4",
    "com5",
    "com6",
    "com7",
    "com8",
    "com9",
    "lpt1",
    "lpt2",
    "lpt3",
    "lpt4",
    "lpt5",
    "lpt6",
    "lpt7",
    "lpt8",
    "lpt9",
]);

function isWindowsReservedPath(normalized: string): boolean {
    const withoutSlash = normalized.replaceAll("/", "\\");
    const segments = withoutSlash.split("\\").filter(Boolean);
    for (const segment of segments) {
        const base = segment.includes(".")
            ? segment.slice(0, Math.max(0, segment.indexOf(".")))
            : segment;
        if (WINDOWS_RESERVED.has(base.toLowerCase())) {
            return true;
        }
    }
    return false;
}

/**
 * Paths that would block, hang, or yield unbounded output when read or listed.
 */
export async function isBlockedDevicePath(
    resolvedPath: string,
): Promise<boolean> {
    const normalized = path.normalize(resolvedPath);

    if (process.platform === "win32") {
        const lower = normalized.toLowerCase();
        if (
            lower.startsWith("\\\\.\\") ||
            lower.startsWith("\\\\?\\") ||
            isWindowsReservedPath(normalized)
        ) {
            return true;
        }
        return false;
    }

    const posix = normalized.replaceAll("\\", "/");
    if (
        posix.startsWith("/dev/") ||
        posix.startsWith("/proc/") ||
        posix.startsWith("/sys/")
    ) {
        return true;
    }
    return false;
}

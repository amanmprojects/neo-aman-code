import * as fs from "node:fs/promises";
import * as path from "node:path";
import { tool, type UIToolInvocation } from "ai";
import { z } from "zod";
import { execa, type ExecaError } from "execa";
import { getBashToolDescription, DEFAULT_TIMEOUT_MS } from "./prompt";

const DANGEROUS_PATTERNS = [
    /rm\s+(-[a-zA-Z]*)?r[a-zA-Z]*f?\s+\/(?!\S)/,
    /rm\s+(-[a-zA-Z]*)?f[a-zA-Z]*r?\s+\/(?!\S)/,
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

type CommandClassification = "read" | "search" | "mutating" | "unknown";

const READ_ONLY_COMMAND_PATTERNS = [
    /^\s*(pwd|which|whereis|whoami|printenv)\b/i,
    /^\s*(ls|tree|find|fd|stat|wc|head|tail|cat)\b/i,
    /^\s*(grep|rg)\b/i,
    /^\s*git\s+(status|diff|show|log|branch)\b/i,
];

const SEARCH_COMMAND_PATTERNS = [/^\s*(grep|rg|find|fd)\b/i];

function classifyCommand(command: string): CommandClassification {
    if (SEARCH_COMMAND_PATTERNS.some((pattern) => pattern.test(command))) {
        return "search";
    }

    if (READ_ONLY_COMMAND_PATTERNS.some((pattern) => pattern.test(command))) {
        return "read";
    }

    if (isDangerousCommand(command)) {
        return "mutating";
    }

    return /\b(mv|cp|sed|perl|python|node|npm|pnpm|bun|git|touch|mkdir|chmod|chown)\b/i.test(
        command,
    )
        ? "mutating"
        : "unknown";
}

function truncateToLimit(text: string, maxChars: number): { text: string; truncated: boolean } {
    if (text.length <= maxChars) {
        return { text, truncated: false };
    }
    return { text: text.slice(0, maxChars), truncated: true };
}

function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    }

    return `${seconds}s`;
}

export function isDangerousCommand(command: string): boolean {
    return DANGEROUS_PATTERNS.some((pattern) => pattern.test(command));
}

export const bash = tool({
    description: getBashToolDescription(),
    inputSchema: z.object({
        command: z.string().describe("The shell command to execute"),
        cwd: z
            .string()
            .optional()
            .describe("Working directory for the command. Defaults to current directory."),
        timeoutMs: z
            .number()
            .int()
            .positive()
            .max(30 * 60_000)
            .optional()
            .describe(
                "Required judgment call: max milliseconds before the process is killed. Examples: ls/cat ~30_000; npm/pnpm/bun install or build ~300_000–900_000; heavy tests adjust up (max 30 min). Omit only for ordinary short commands (then default 10 min applies).",
            ),
        maxOutputChars: z
            .number()
            .int()
            .positive()
            .max(200_000)
            .optional()
            .describe("Maximum number of stdout or stderr characters to retain. Defaults to 12000."),
        background: z
            .boolean()
            .optional()
            .describe("If true, start the command in the background and return immediately."),
    }),
    async execute({
        command,
        cwd,
        timeoutMs = DEFAULT_TIMEOUT_MS,
        maxOutputChars = DEFAULT_MAX_OUTPUT_CHARS,
        background = false,
    }) {
        const resolvedCwd = cwd ? path.resolve(cwd) : process.cwd();
        const classification = classifyCommand(command);

        try {
            const cwdStat = await fs.stat(resolvedCwd);
            if (!cwdStat.isDirectory()) {
                return {
                    error: `Working directory is not a directory: ${resolvedCwd}`,
                };
            }

            const startedAt = Date.now();

            if (background) {
                const subprocess = execa(command, [], {
                    cwd: resolvedCwd,
                    shell: true,
                    detached: true,
                    stdio: "ignore",
                    env: process.env,
                    reject: false,
                });

                if (subprocess.pid === undefined) {
                    const errorMessage =
                        "Failed to start background command: subprocess did not provide a PID.";
                    return {
                        command,
                        cwd: resolvedCwd,
                        classification,
                        background: true,
                        pid: null,
                        startedAt,
                        stdout: "",
                        stderr: errorMessage,
                        exitCode: 1,
                        error: errorMessage,
                    };
                }

                subprocess.unref?.();

                return {
                    command,
                    cwd: resolvedCwd,
                    classification,
                    background: true,
                    pid: subprocess.pid,
                    startedAt,
                    stdout: "",
                    stderr: "",
                    exitCode: undefined,
                };
            }

            // Buffered subprocess: streaming + `all: true` can stall npm/yarn (progress bars, backpressure).
            // `stdin: ignore` avoids hangs on prompts. Non-TTY-style env reduces interactive behavior.
            const childEnv = {
                ...process.env,
                CI: process.env.CI ?? "true",
                npm_config_progress: process.env.npm_config_progress ?? "false",
                NPM_CONFIG_PROGRESS: process.env.NPM_CONFIG_PROGRESS ?? "false",
                npm_config_loglevel: process.env.npm_config_loglevel ?? "warn",
                FORCE_COLOR: process.env.FORCE_COLOR ?? "0",
            } as NodeJS.ProcessEnv;

            const result = await execa(command, [], {
                cwd: resolvedCwd,
                shell: true,
                env: childEnv,
                stdin: "ignore",
                reject: false,
                timeout: timeoutMs,
                forceKillAfterDelay: 2_000,
            });

            let stdoutRaw = typeof result.stdout === "string" ? result.stdout : "";
            let stderrRaw = typeof result.stderr === "string" ? result.stderr : "";

            const outTrunc = truncateToLimit(stdoutRaw, maxOutputChars);
            const errTrunc = truncateToLimit(stderrRaw, maxOutputChars);
            let stdout = outTrunc.text.trimEnd();
            let stderr = errTrunc.text.trimEnd();
            const stdoutTruncated = outTrunc.truncated;
            const stderrTruncated = errTrunc.truncated;

            const exitCode = result.exitCode ?? (result.timedOut ? SIGTERM : 1);

            if (result.timedOut) {
                stderr = `Command timed out after ${formatDuration(timeoutMs)}\n${stderr}`;
            }

            return {
                command,
                cwd: resolvedCwd,
                classification,
                background: false,
                durationMs: Date.now() - startedAt,
                timeoutMs,
                timedOut: Boolean(result.timedOut),
                aborted: false,
                stdout,
                stderr,
                stdoutTruncated,
                stderrTruncated,
                exitCode,
                signal: result.signal,
                ...(result.failed && result.shortMessage ? { error: result.shortMessage } : {}),
            };
        } catch (error: unknown) {
            const execaError = error as ExecaError;
            return {
                command,
                cwd: resolvedCwd,
                classification,
                background: false,
                stdout: "",
                stderr: "",
                exitCode: execaError?.exitCode ?? (execaError?.code === "ENOENT" ? 127 : 1),
                error:
                    execaError?.shortMessage ||
                    (error instanceof Error ? error.message : String(error)),
            };
        }
    },
});

export type BashToolInvocation = UIToolInvocation<typeof bash>;

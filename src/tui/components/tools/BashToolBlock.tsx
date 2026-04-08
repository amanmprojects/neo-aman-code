import type {
    BashToolInvocation,
    BashToolOutput,
    BashToolOutputBackgroundStartFailed,
    BashToolOutputBackgroundStarted,
    BashToolOutputEarlyError,
    BashToolOutputForeground,
    BashToolOutputForegroundCaught,
} from "../../../agent/tools/bash-tool";
import { useVerbose } from "../../hooks/verbose";
import { theme } from "../../theme";
import { AssistantToolFrame } from "../MessageFrames";

const MAX_STREAM_LINES = 8;
const MAX_STREAM_LINES_VERBOSE = 24;

function isBashToolOutputEarlyError(output: BashToolOutput): output is BashToolOutputEarlyError {
    return "error" in output && !("command" in output);
}

function formatDurationMs(ms: number): string {
    const seconds = ms / 1000;
    if (seconds < 60) {
        return `${seconds.toFixed(1)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);
    return `${minutes}m ${remaining}s`;
}

function clipStreams(stdout: string, stderr: string, maxLines: number): string {
    const parts: string[] = [];
    if (stdout) {
        const lines = stdout.split("\n");
        const head = lines.slice(0, maxLines);
        parts.push(`stdout:\n${head.join("\n")}`);
        if (lines.length > maxLines) {
            parts.push(`… ${lines.length - maxLines} more stdout lines`);
        }
    }
    if (stderr) {
        const lines = stderr.split("\n");
        const head = lines.slice(0, maxLines);
        parts.push(`stderr:\n${head.join("\n")}`);
        if (lines.length > maxLines) {
            parts.push(`… ${lines.length - maxLines} more stderr lines`);
        }
    }
    return parts.join("\n\n");
}

function formatBashOutput(output: BashToolOutput, verbose: boolean): string {
    if (isBashToolOutputEarlyError(output)) {
        return output.error;
    }

    if (output.background === true) {
        if (output.pid === null) {
            const failed = output as BashToolOutputBackgroundStartFailed;
            return `${failed.command} — background start failed: ${failed.error}`;
        }
        const started = output as BashToolOutputBackgroundStarted;
        const line = `bashTool — bg pid=${started.pid} · ${started.classification} — ${started.command}`;
        if (!verbose) {
            return line;
        }
        return `${line}\ncwd: ${started.cwd}`;
    }

    if ("durationMs" in output) {
        const fg = output as BashToolOutputForeground;
        const bits = [
            `exit ${fg.exitCode}`,
            fg.classification,
            formatDurationMs(fg.durationMs),
        ];
        if (fg.timedOut) {
            bits.push("timed out");
        }
        if (fg.signal) {
            bits.push(String(fg.signal));
        }
        if (fg.stdoutTruncated || fg.stderrTruncated) {
            bits.push("truncated");
        }
        let line = `bashTool — ${bits.join(" · ")} — ${fg.command}`;
        if (fg.error) {
            line += ` — ${fg.error}`;
        }
        const maxLines = verbose ? MAX_STREAM_LINES_VERBOSE : MAX_STREAM_LINES;
        const streams = clipStreams(fg.stdout, fg.stderr, maxLines);
        if (verbose) {
            const body = streams ? `${line}\ncwd: ${fg.cwd}\n\n${streams}` : `${line}\ncwd: ${fg.cwd}`;
            return body;
        }
        return streams ? `${line}\n\n${streams}` : line;
    }

    const caught = output as BashToolOutputForegroundCaught;
    return `bashTool — exit ${caught.exitCode} — ${caught.command} — ${caught.error}`;
}

function formatInputLine(input: NonNullable<BashToolInvocation["input"]>): string {
    const cwd = input.cwd ? ` @ ${input.cwd}` : "";
    const bg = input.background ? " (background)" : "";
    return `${input.command}${cwd}${bg}`;
}

export function BashToolBlock({ invocation }: { invocation: BashToolInvocation }) {
    const verbose = useVerbose();
    switch (invocation.state) {
        case "input-streaming":
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>bashTool — reading arguments…</text>
                </AssistantToolFrame>
            );
        case "input-available":
            return (
                <AssistantToolFrame border={["left"]}>
                    <text fg={theme.muted}>bashTool — {formatInputLine(invocation.input)}</text>
                </AssistantToolFrame>
            );
        case "output-available":
            return (
                <AssistantToolFrame border={["left"]}>
                    <text fg={theme.muted}>{formatBashOutput(invocation.output, verbose)}</text>
                </AssistantToolFrame>
            );
        case "output-error":
            return (
                <AssistantToolFrame border={["left"]}>
                    <text fg={theme.muted}>bashTool — error: {invocation.errorText}</text>
                </AssistantToolFrame>
            );
        case "approval-requested":
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>
                        bashTool — approval requested (not configured in this client)
                    </text>
                </AssistantToolFrame>
            );
        case "approval-responded":
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>bashTool — approval responded</text>
                </AssistantToolFrame>
            );
        default:
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>bashTool — unknown state</text>
                </AssistantToolFrame>
            );
    }
}

import type { BashToolInvocation } from "../../../agent/tools/bash-tool";
import { useVerbose } from "../../hooks/verbose";
import { theme } from "../../theme";
import { MessageFrame } from "../MessageFrame";

const MAX_LINES = 8;

function clipText(text: string, maxLines: number): string {
    const lines = text.split("\n");
    if (lines.length <= maxLines) return text;
    return [...lines.slice(0, maxLines), `… ${lines.length - maxLines} more lines`].join("\n");
}

function formatBashOutput(output: NonNullable<BashToolInvocation["output"]>, verbose: boolean): string {
    if (output && typeof output === "object" && "error" in output && typeof output.error === "string") {
        return output.error;
    }
    const o = output as Record<string, unknown>;
    if (typeof o.error === "string") {
        return o.error;
    }

    const cmd = typeof o.command === "string" ? o.command : "";
    const cwd = typeof o.cwd === "string" ? o.cwd : "";
    const exitCode = o.exitCode;
    const head = `bash — ${cmd}${cwd ? ` (${cwd})` : ""}${
        exitCode !== undefined && exitCode !== null ? ` exit ${exitCode}` : ""
    }`;

    if (!verbose) {
        return head;
    }

    const parts = [head];
    if (o.background === true && typeof o.pid === "number") {
        parts.push(`background pid ${o.pid}`);
    }
    if (o.timedOut === true) {
        parts.push("timed out");
    }
    if (typeof o.stdout === "string" && o.stdout) {
        parts.push("stdout:", clipText(o.stdout, MAX_LINES));
    }
    if (typeof o.stderr === "string" && o.stderr) {
        parts.push("stderr:", clipText(o.stderr, MAX_LINES));
    }
    if (o.stdoutTruncated === true || o.stderrTruncated === true) {
        parts.push("(output truncated)");
    }
    return parts.join("\n");
}

export function BashToolBlock({ invocation }: { invocation: BashToolInvocation }) {
    const verbose = useVerbose();

    switch (invocation.state) {
        case "input-streaming":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>bash — reading arguments…</text>
                </MessageFrame>
            );
        case "input-available":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel} borderStyle="heavy">
                    <text fg={theme.muted}>
                        bash — {typeof invocation.input.command === "string" ? invocation.input.command : "…"}
                    </text>
                </MessageFrame>
            );
        case "output-available":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel} borderStyle="heavy">
                    <text fg={theme.muted}>{formatBashOutput(invocation.output, verbose)}</text>
                </MessageFrame>
            );
        case "output-error":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel} borderStyle="heavy">
                    <text fg={theme.muted}>bash — error: {invocation.errorText}</text>
                </MessageFrame>
            );
        case "approval-requested":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>bash — approval requested (not configured in this client)</text>
                </MessageFrame>
            );
        case "approval-responded":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>bash — approval responded</text>
                </MessageFrame>
            );
        default:
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>bash — unknown state</text>
                </MessageFrame>
            );
    }
}

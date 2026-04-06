import type { GrepSearchToolInvocation } from "../../../agent/tools/grep-search";
import { useVerbose } from "../../hooks/verbose";
import { theme } from "../../theme";
import { MessageFrame } from "../MessageFrame";

const MAX_LINES = 10;

function clipLines(text: string, maxLines: number): string {
    const lines = text.split("\n");
    if (lines.length <= maxLines) return text;
    return [...lines.slice(0, maxLines), `… ${lines.length - maxLines} more lines`].join("\n");
}

function formatGrepOutput(
    output: NonNullable<GrepSearchToolInvocation["output"]>,
    verbose: boolean,
): string {
    if (output && typeof output === "object" && "error" in output && typeof output.error === "string") {
        return output.error;
    }
    const o = output as Record<string, unknown>;
    const pattern = typeof o.pattern === "string" ? o.pattern : "?";
    const p = typeof o.path === "string" ? o.path : ".";
    const mode = typeof o.outputMode === "string" ? o.outputMode : "";
    const head = `grepSearch — "${pattern}" in ${p}${mode ? ` (${mode})` : ""}`;

    if (!verbose) {
        if (typeof o.matchCount === "number") {
            return `${head} — ${o.matchCount} match(es)`;
        }
        if (typeof o.numFiles === "number") {
            return `${head} — ${o.numFiles} file(s)`;
        }
        return head;
    }

    const lines = [head];
    if (o.truncated === true) {
        lines.push("(truncated)");
    }
    if (typeof o.content === "string" && o.content) {
        lines.push(clipLines(o.content, MAX_LINES));
    } else if (Array.isArray(o.matches)) {
        const m = o.matches as unknown[];
        lines.push(
            m
                .slice(0, MAX_LINES)
                .map((x) => String(x))
                .join("\n"),
        );
        if (m.length > MAX_LINES) {
            lines.push(`… ${m.length - MAX_LINES} more`);
        }
    }
    return lines.join("\n");
}

export function GrepSearchToolBlock({ invocation }: { invocation: GrepSearchToolInvocation }) {
    const verbose = useVerbose();

    switch (invocation.state) {
        case "input-streaming":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>grepSearch — reading arguments…</text>
                </MessageFrame>
            );
        case "input-available":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel} borderStyle="heavy">
                    <text fg={theme.muted}>grepSearch — {invocation.input.pattern}</text>
                </MessageFrame>
            );
        case "output-available":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel} borderStyle="heavy">
                    <text fg={theme.muted}>{formatGrepOutput(invocation.output, verbose)}</text>
                </MessageFrame>
            );
        case "output-error":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel} borderStyle="heavy">
                    <text fg={theme.muted}>grepSearch — error: {invocation.errorText}</text>
                </MessageFrame>
            );
        case "approval-requested":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>grepSearch — approval requested (not configured in this client)</text>
                </MessageFrame>
            );
        case "approval-responded":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>grepSearch — approval responded</text>
                </MessageFrame>
            );
        default:
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>grepSearch — unknown state</text>
                </MessageFrame>
            );
    }
}

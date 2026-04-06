import type { GlobSearchToolInvocation } from "../../../agent/tools/glob-search";
import { useVerbose } from "../../hooks/verbose";
import { theme } from "../../theme";
import { MessageFrame } from "../MessageFrame";

const MAX_ENTRIES = 12;

function formatGlobOutput(
    output: NonNullable<GlobSearchToolInvocation["output"]>,
    verbose: boolean,
): string {
    if (output && typeof output === "object" && "error" in output && typeof output.error === "string") {
        return output.error;
    }
    const o = output as Record<string, unknown>;
    const pattern = typeof o.pattern === "string" ? o.pattern : "?";
    const p = typeof o.path === "string" ? o.path : typeof o.searchPath === "string" ? o.searchPath : ".";
    const head = `globSearch — "${pattern}" in ${p}`;

    if (!verbose) {
        const n = typeof o.resultCount === "number" ? o.resultCount : typeof o.numFiles === "number" ? o.numFiles : 0;
        return `${head} — ${n} result(s)${o.truncated === true ? " (truncated)" : ""}`;
    }

    const lines = [head];
    if (o.truncated === true) {
        lines.push("(truncated)");
    }
    const filenames = Array.isArray(o.filenames)
        ? o.filenames
        : Array.isArray(o.results)
          ? o.results
          : [];
    const list = filenames as unknown[];
    for (const entry of list.slice(0, MAX_ENTRIES)) {
        lines.push(`  ${String(entry)}`);
    }
    if (list.length > MAX_ENTRIES) {
        lines.push(`… ${list.length - MAX_ENTRIES} more`);
    }
    return lines.join("\n");
}

export function GlobSearchToolBlock({ invocation }: { invocation: GlobSearchToolInvocation }) {
    const verbose = useVerbose();

    switch (invocation.state) {
        case "input-streaming":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>globSearch — reading arguments…</text>
                </MessageFrame>
            );
        case "input-available":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel} borderStyle="heavy">
                    <text fg={theme.muted}>globSearch — {invocation.input.pattern}</text>
                </MessageFrame>
            );
        case "output-available":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel} borderStyle="heavy">
                    <text fg={theme.muted}>{formatGlobOutput(invocation.output, verbose)}</text>
                </MessageFrame>
            );
        case "output-error":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel} borderStyle="heavy">
                    <text fg={theme.muted}>globSearch — error: {invocation.errorText}</text>
                </MessageFrame>
            );
        case "approval-requested":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>globSearch — approval requested (not configured in this client)</text>
                </MessageFrame>
            );
        case "approval-responded":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>globSearch — approval responded</text>
                </MessageFrame>
            );
        default:
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>globSearch — unknown state</text>
                </MessageFrame>
            );
    }
}

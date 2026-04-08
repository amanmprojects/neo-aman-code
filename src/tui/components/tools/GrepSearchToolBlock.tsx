import type { GrepSearchToolInvocation } from "../../../agent/tools/grep-search";
import { useVerbose } from "../../hooks/verbose";
import { theme } from "../../theme";
import { AssistantToolFrame } from "../MessageFrames";

function formatGrepSummaryLine(output: NonNullable<GrepSearchToolInvocation["output"]>): string {
    const base = `grepSearch — ${output.pattern} @ ${output.path}`;
    if ("message" in output && typeof output.message === "string") {
        return `${base} — ${output.message}`;
    }
    if ("numMatches" in output && typeof output.numMatches === "number") {
        return `${base} — ${output.numMatches} matches in ${output.numFiles} files${output.truncated ? " (truncated)" : ""}`;
    }
    if ("numLines" in output && typeof output.numLines === "number") {
        return `${base} — ${output.numLines} lines, ${output.matchCount} matches${output.truncated ? " (truncated)" : ""}`;
    }
    if (typeof output.matchCount === "number") {
        return `${base} — ${output.matchCount} file${output.matchCount === 1 ? "" : "s"}${output.truncated ? " (truncated)" : ""}`;
    }
    return base;
}

function formatGrepVerboseBody(output: NonNullable<GrepSearchToolInvocation["output"]>): string | undefined {
    if ("content" in output && typeof output.content === "string") {
        return output.content;
    }
    if ("matches" in output && Array.isArray(output.matches) && output.matches.length > 0) {
        return output.matches.join("\n");
    }
    return undefined;
}

function formatGrepOutput(
    output: NonNullable<GrepSearchToolInvocation["output"]>,
    verbose: boolean,
): string {
    if ("error" in output && typeof output.error === "string") {
        return output.error;
    }
    if (!verbose) {
        return formatGrepSummaryLine(output);
    }
    const summary = formatGrepSummaryLine(output);
    const body = formatGrepVerboseBody(output);
    if (body === undefined) {
        return summary;
    }
    return `${summary}\n${body}`;
}

export function GrepSearchToolBlock({ invocation }: { invocation: GrepSearchToolInvocation }) {
    const verbose = useVerbose();
    switch (invocation.state) {
        case "input-streaming":
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>grepSearch — reading arguments…</text>
                </AssistantToolFrame>
            );
        case "input-available": {
            const root = invocation.input.path ?? invocation.input.searchPath ?? "(cwd)";
            return (
                <AssistantToolFrame border={["left"]}>
                    <text fg={theme.muted}>
                        grepSearch — {invocation.input.pattern} @ {root}
                    </text>
                </AssistantToolFrame>
            );
        }
        case "output-available":
            return (
                <AssistantToolFrame border={["left"]}>
                    <text fg={theme.muted}>{formatGrepOutput(invocation.output, verbose)}</text>
                </AssistantToolFrame>
            );
        case "output-error":
            return (
                <AssistantToolFrame border={["left"]}>
                    <text fg={theme.muted}>grepSearch — error: {invocation.errorText}</text>
                </AssistantToolFrame>
            );
        case "approval-requested":
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>grepSearch — approval requested (not configured in this client)</text>
                </AssistantToolFrame>
            );
        case "approval-responded":
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>grepSearch — approval responded</text>
                </AssistantToolFrame>
            );
        default:
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>grepSearch — unknown state</text>
                </AssistantToolFrame>
            );
    }
}

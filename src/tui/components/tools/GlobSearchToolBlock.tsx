import type { GlobSearchToolInvocation } from "../../../agent/tools/glob-search";
import { useVerbose } from "../../hooks/verbose";
import { theme } from "../../theme";
import { AssistantToolFrame } from "../MessageFrames";

function formatGlobOutput(
    output: NonNullable<GlobSearchToolInvocation["output"]>,
    verbose: boolean,
): string {
    if ("error" in output && typeof output.error === "string") {
        return output.error;
    }
    if (!verbose) {
        const total =
            "totalMatches" in output && typeof output.totalMatches === "number"
                ? output.totalMatches
                : typeof output.numFiles === "number"
                  ? output.numFiles
                  : 0;
        return `globSearch — ${output.pattern} @ ${output.path} — ${total} match${total === 1 ? "" : "es"}${output.truncated ? " (truncated)" : ""}`;
    }
    const lines = [
        `globSearch — ${output.pattern} @ ${output.path}`,
        `${output.numFiles} results in page${output.truncated ? " (truncated)" : ""} — ${output.durationMs}ms`,
    ];
    if ("totalMatches" in output && typeof output.totalMatches === "number") {
        lines.push(`totalMatches: ${output.totalMatches}`);
    }
    for (const name of output.filenames) {
        lines.push(`  ${name}`);
    }
    return lines.join("\n");
}

export function GlobSearchToolBlock({ invocation }: { invocation: GlobSearchToolInvocation }) {
    const verbose = useVerbose();
    switch (invocation.state) {
        case "input-streaming":
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>globSearch — reading arguments…</text>
                </AssistantToolFrame>
            );
        case "input-available": {
            const root = invocation.input.path ?? invocation.input.searchPath ?? "(cwd)";
            return (
                <AssistantToolFrame border={["left"]}>
                    <text fg={theme.muted}>
                        globSearch — {invocation.input.pattern} @ {root}
                    </text>
                </AssistantToolFrame>
            );
        }
        case "output-available":
            return (
                <AssistantToolFrame border={["left"]}>
                    <text fg={theme.muted}>{formatGlobOutput(invocation.output, verbose)}</text>
                </AssistantToolFrame>
            );
        case "output-error":
            return (
                <AssistantToolFrame border={["left"]}>
                    <text fg={theme.muted}>globSearch — error: {invocation.errorText}</text>
                </AssistantToolFrame>
            );
        case "approval-requested":
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>globSearch — approval requested (not configured in this client)</text>
                </AssistantToolFrame>
            );
        case "approval-responded":
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>globSearch — approval responded</text>
                </AssistantToolFrame>
            );
        default:
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>globSearch — unknown state</text>
                </AssistantToolFrame>
            );
    }
}

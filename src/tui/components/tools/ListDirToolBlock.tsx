import type { ListDirToolInvocation } from "../../../agent/tools/list-dir";
import { useVerbose } from "../../hooks/verbose";
import { theme } from "../../theme";
import { AssistantToolFrame } from "../MessageFrames";

function formatListDirOutput(
    output: NonNullable<ListDirToolInvocation["output"]>,
    verbose: boolean,
): string {
    if ("error" in output && typeof output.error === "string") {
        return output.error;
    }
    if (!verbose) {
        return `Listed: ${output.path}`;
    }
    const lines = [
        `Listed: ${output.path}`,
        `${output.count} of ${output.totalCount} entries${output.truncated ? " (truncated)" : ""}`,
    ];
    for (const entry of output.entries) {
        const size =
            entry.size !== undefined ? ` ${entry.size}B` : entry.children !== undefined ? ` (${entry.children} items)` : "";
        lines.push(`  ${entry.name} [${entry.type}]${size}`);
    }
    return lines.join("\n");
}

export function ListDirToolBlock({ invocation }: { invocation: ListDirToolInvocation }) {
    const verbose = useVerbose();
    switch (invocation.state) {
        case "input-streaming":
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>listDir — reading arguments…</text>
                </AssistantToolFrame>
            );
        case "input-available": {
            const path = invocation.input.path ?? "(cwd)";
            return (
                <AssistantToolFrame border={["left"]}>
                    <text fg={theme.muted}>listDir — {path}</text>
                </AssistantToolFrame>
            );
        }
        case "output-available":
            return (
                <AssistantToolFrame border={["left"]}>
                    <text fg={theme.muted}>{formatListDirOutput(invocation.output, verbose)}</text>
                </AssistantToolFrame>
            );
        case "output-error":
            return (
                <AssistantToolFrame border={["left"]}>
                    <text fg={theme.muted}>listDir — error: {invocation.errorText}</text>
                </AssistantToolFrame>
            );
        case "approval-requested":
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>listDir — approval requested (not configured in this client)</text>
                </AssistantToolFrame>
            );
        case "approval-responded":
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>listDir — approval responded</text>
                </AssistantToolFrame>
            );
        default:
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>listDir — unknown state</text>
                </AssistantToolFrame>
            );
    }
}

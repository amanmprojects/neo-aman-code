import type { ListDirToolInvocation } from "../../../agent/tools/list-dir/list-dir";
import { theme } from "../../theme";
import { MessageFrame } from "../MessageFrame";

const MAX_ENTRY_LINES = 18;

function formatListDirOutput(output: NonNullable<ListDirToolInvocation["output"]>): string {
    if ("error" in output && typeof output.error === "string") {
        return output.error;
    }
    const lines = [
        `Listed: ${output.path}`,
        `${output.count} of ${output.totalCount} entries${output.truncated ? " (truncated)" : ""}`,
    ];
    for (const entry of output.entries.slice(0, MAX_ENTRY_LINES)) {
        const size =
            entry.size !== undefined ? ` ${entry.size}B` : entry.children !== undefined ? ` (${entry.children} items)` : "";
        lines.push(`  ${entry.name} [${entry.type}]${size}`);
    }
    if (output.entries.length > MAX_ENTRY_LINES) {
        lines.push(`  … ${output.entries.length - MAX_ENTRY_LINES} more`);
    }
    return lines.join("\n");
}

export function ListDirToolBlock({ invocation }: { invocation: ListDirToolInvocation }) {
    switch (invocation.state) {
        case "input-streaming":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>listDir — reading arguments…</text>
                </MessageFrame>
            );
        case "input-available": {
            const path = invocation.input.path ?? "(cwd)";
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel}>
                    <text fg={theme.muted}>listDir — {path}</text>
                </MessageFrame>
            );
        }
        case "output-available":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel}>
                    <text fg={theme.text}>{formatListDirOutput(invocation.output)}</text>
                </MessageFrame>
            );
        case "output-error":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel}>
                    <text fg={theme.muted}>listDir — error: {invocation.errorText}</text>
                </MessageFrame>
            );
        case "approval-requested":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>listDir — approval requested (not configured in this client)</text>
                </MessageFrame>
            );
        case "approval-responded":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>listDir — approval responded</text>
                </MessageFrame>
            );
        default:
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>listDir — unknown state</text>
                </MessageFrame>
            );
    }
}

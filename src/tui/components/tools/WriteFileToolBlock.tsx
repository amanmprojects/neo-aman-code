import type { WriteFileToolInvocation } from "../../../agent/tools/write-file";
import { theme } from "../../theme";
import { MessageFrame } from "../MessageFrame";
import { ToolDiffPreview } from "./ToolDiffPreview";

function formatWriteSummary(output: NonNullable<WriteFileToolInvocation["output"]>): string {
    if (output && typeof output === "object" && "error" in output && typeof output.error === "string") {
        return output.error;
    }
    const o = output as {
        filePath?: string;
        action?: string;
        lines?: number;
        bytes?: number;
    };
    return `${o.filePath ?? "?"} — ${o.action ?? "done"} (${o.lines ?? 0} lines, ${o.bytes ?? 0} bytes)`;
}

export function WriteFileToolBlock({ invocation }: { invocation: WriteFileToolInvocation }) {
    switch (invocation.state) {
        case "input-streaming":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>writeFile — reading arguments…</text>
                </MessageFrame>
            );
        case "input-available":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel} borderStyle="heavy">
                    <text fg={theme.muted}>writeFile — {invocation.input.filePath}</text>
                </MessageFrame>
            );
        case "output-available": {
            const out = invocation.output;
            const err =
                out && typeof out === "object" && "error" in out && typeof out.error === "string"
                    ? out.error
                    : null;
            if (err) {
                return (
                    <MessageFrame border={["left"]} borderColor={theme.panel} borderStyle="heavy">
                        <text fg={theme.muted}>writeFile — {err}</text>
                    </MessageFrame>
                );
            }
            const success = out as { filePath?: string; diff?: string };
            const diff = typeof success.diff === "string" ? success.diff : "";
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel} borderStyle="heavy">
                    <box flexDirection="column" gap={1} width="100%" minWidth={0}>
                        <text fg={theme.muted}>{formatWriteSummary(invocation.output)}</text>
                        <ToolDiffPreview diffText={diff} />
                    </box>
                </MessageFrame>
            );
        }
        case "output-error":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel} borderStyle="heavy">
                    <text fg={theme.muted}>writeFile — error: {invocation.errorText}</text>
                </MessageFrame>
            );
        case "approval-requested":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>writeFile — approval requested (not configured in this client)</text>
                </MessageFrame>
            );
        case "approval-responded":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>writeFile — approval responded</text>
                </MessageFrame>
            );
        default:
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>writeFile — unknown state</text>
                </MessageFrame>
            );
    }
}

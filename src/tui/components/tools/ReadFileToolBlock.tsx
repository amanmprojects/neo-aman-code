import type { ReadFileToolInvocation } from "../../../agent/tools/read-file/read-file";
import { theme } from "../../theme";
import { MessageFrame } from "../MessageFrame";

const MAX_CONTENT_LINES = 0;

function formatReadFileOutput(output: NonNullable<ReadFileToolInvocation["output"]>): string {
    if ("error" in output && typeof output.error === "string") {
        return output.error;
    }
    const header = `${output.filePath} — lines ${output.startLine}–${output.endLine} of ${output.totalLines}`;
    const bodyLines = output.content.split("\n");
    const clipped =
        bodyLines.length > MAX_CONTENT_LINES
            ? [...bodyLines.slice(0, MAX_CONTENT_LINES), `… ${bodyLines.length - MAX_CONTENT_LINES} more lines`]
            : bodyLines;
    return `${header}\n${clipped.join("\n")}`;
}

export function ReadFileToolBlock({ invocation }: { invocation: ReadFileToolInvocation }) {
    switch (invocation.state) {
        case "input-streaming":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>Reading file…</text>
                </MessageFrame>
            );
        case "input-available":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel} borderStyle="heavy">
                    <text fg={theme.muted}>Read File: {invocation.input.filePath}</text>
                </MessageFrame>
            );
        case "output-available":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel} borderStyle="heavy">
                    <text fg={theme.text}>{formatReadFileOutput(invocation.output)}</text>
                </MessageFrame>
            );
        case "output-error":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel} borderStyle="heavy">
                    <text fg={theme.muted}>readFile — error: {invocation.errorText}</text>
                </MessageFrame>
            );
        case "approval-requested":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>readFile — approval requested (not configured in this client)</text>
                </MessageFrame>
            );
        case "approval-responded":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>readFile — approval responded</text>
                </MessageFrame>
            );
        default:
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>readFile — unknown state</text>
                </MessageFrame>
            );
    }
}

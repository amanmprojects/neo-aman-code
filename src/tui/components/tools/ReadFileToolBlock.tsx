import type { ReadFileToolInvocation } from "../../../agent/tools/read-file";
import { useVerbose } from "../../hooks/verbose";
import { theme } from "../../theme";
import { MessageFrame } from "../MessageFrame";

const MAX_CONTENT_LINES = 10;

function formatReadFileHeader(output: NonNullable<ReadFileToolInvocation["output"]>): string {
    if ("error" in output && typeof output.error === "string") {
        return output.error;
    }
    return `${output.filePath} — lines ${output.startLine}–${output.endLine} of ${output.totalLines}`;
}

function formatReadFileOutput(
    output: NonNullable<ReadFileToolInvocation["output"]>,
    verbose: boolean,
): string {
    if ("error" in output && typeof output.error === "string") {
        return output.error;
    }
    const header = formatReadFileHeader(output);
    if (!verbose) {
        return header;
    }
    const bodyLines = output.content.split("\n");
    const clipped =
        bodyLines.length > MAX_CONTENT_LINES
            ? [...bodyLines.slice(0, MAX_CONTENT_LINES), `… ${bodyLines.length - MAX_CONTENT_LINES} more lines`]
            : bodyLines;
    return `${header}\n${clipped.join("\n")}`;
}

export function ReadFileToolBlock({ invocation }: { invocation: ReadFileToolInvocation }) {
    const verbose = useVerbose();
    switch (invocation.state) {
        case "input-streaming":
            return (
                <MessageFrame border={false} >
                    <text fg={theme.muted}>Reading file…</text>
                </MessageFrame>
            );
        case "input-available":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel} borderStyle="heavy" >
                    <text fg={theme.muted}>Reading File: {invocation.input.filePath}</text>
                </MessageFrame>
            );
        case "output-available":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel} borderStyle="heavy" >
                    <text fg={theme.muted}>Read File: {formatReadFileOutput(invocation.output, verbose)}</text>
                </MessageFrame>
            );
        case "output-error":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel} borderStyle="heavy" >
                    <text fg={theme.muted}>Read File — error: {invocation.errorText}</text>
                </MessageFrame>
            );
        case "approval-requested":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>Read File — approval requested (not configured in this client)</text>
                </MessageFrame>
            );
        case "approval-responded":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>Read File — approval responded</text>
                </MessageFrame>
            );
        default:
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>Read File — unknown state</text>
                </MessageFrame>
            );
    }
}

import type { ReadFileToolInvocation } from "../../../agent/tools/read-file";
import { useVerbose } from "../../hooks/verbose";
import { theme } from "../../theme";
import { AssistantToolFrame } from "../MessageFrames";

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
                <AssistantToolFrame border={false} >
                    <text fg={theme.muted}>Reading file…</text>
                </AssistantToolFrame>
            );
        case "input-available":
            return (
                <AssistantToolFrame border={["left"]} >
                    <text fg={theme.muted}>Reading File: {invocation.input.filePath}</text>
                </AssistantToolFrame>
            );
        case "output-available":
            return (
                <AssistantToolFrame border={["left"]} >
                    <text fg={theme.muted}>Read File: {formatReadFileOutput(invocation.output, verbose)}</text>
                </AssistantToolFrame>
            );
        case "output-error":
            return (
                <AssistantToolFrame border={["left"]} >
                    <text fg={theme.muted}>Read File — error: {invocation.errorText}</text>
                </AssistantToolFrame>
            );
        case "approval-requested":
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>Read File — approval requested (not configured in this client)</text>
                </AssistantToolFrame>
            );
        case "approval-responded":
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>Read File — approval responded</text>
                </AssistantToolFrame>
            );
        default:
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>Read File — unknown state</text>
                </AssistantToolFrame>
            );
    }
}

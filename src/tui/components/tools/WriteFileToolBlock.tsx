import { createTwoFilesPatch } from "diff";
import type { WriteFileToolInvocation } from "../../../agent/tools/write-file";
import { theme } from "../../theme";
import { AssistantToolFrame } from "../MessageFrames";
import { filetypeForPath } from "../../utils/fileTypes";

const FULL_DIFF_CONTEXT = Number.MAX_SAFE_INTEGER;

function writeFilePatch(filePath: string, content: string): string {
    const normalizedPath = filePath || "file";
    return createTwoFilesPatch(
        `a/${normalizedPath.replaceAll("\\", "/").replace(/^\/+/, "")}`,
        `b/${normalizedPath.replaceAll("\\", "/").replace(/^\/+/, "")}`,
        "",
        content,
        "original",
        "modified",
        {
        context: FULL_DIFF_CONTEXT,
        },
    );
}

function WriteFileDiffView({ filePath, content }: { filePath: string; content: string }) {
    const patch = writeFilePatch(filePath, content);
    const filetype = filetypeForPath(filePath);
    return (
        <box flexDirection="column" gap={1} minWidth={0} width="100%">
            <diff
                diff={patch}
                filetype={filetype}
                view="unified"
                showLineNumbers
                width="100%"
                minWidth={0}
            />
        </box>
    );
}

function formatOutputHeader(output: NonNullable<WriteFileToolInvocation["output"]>): string {
    if ("error" in output && typeof output.error === "string") {
        return output.error;
    }
    const action = output.action === "written" ? "written" : "created";
    return `${output.filePath} — ${action} — ${output.lines} lines, ${output.bytes} bytes`;
}

export function WriteFileToolBlock({ invocation }: { invocation: WriteFileToolInvocation }) {
    switch (invocation.state) {
        case "input-streaming":
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>writeFile — reading arguments…</text>
                </AssistantToolFrame>
            );
        case "input-available": {
            const fp = invocation.input.filePath ?? "(path)";
            const content = invocation.input.content ?? "";
            const ow = invocation.input.overwrite === true ? " (overwrite)" : "";
            return (
                <AssistantToolFrame border={["left"]}>
                    <box flexDirection="column" gap={1} minWidth={0} width="100%">
                        <text fg={theme.muted}>
                            writeFile — {fp}
                            {ow}
                        </text>
                        <WriteFileDiffView filePath={fp} content={content} />
                    </box>
                </AssistantToolFrame>
            );
        }
        case "output-available": {
            const out = invocation.output;
            if ("error" in out && typeof out.error === "string") {
                return (
                    <AssistantToolFrame border={["left"]}>
                        <text fg={theme.muted}>writeFile — error: {out.error}</text>
                    </AssistantToolFrame>
                );
            }
            const fp = invocation.input.filePath ?? out.filePath;
            const content = invocation.input.content ?? "";
            return (
                <AssistantToolFrame border={["left"]}>
                    <box flexDirection="column" gap={1} minWidth={0} width="100%">
                        <text fg={theme.muted}>writeFile — {formatOutputHeader(out)}</text>
                        <WriteFileDiffView filePath={fp} content={content} />
                    </box>
                </AssistantToolFrame>
            );
        }
        case "output-error":
            return (
                <AssistantToolFrame border={["left"]}>
                    <text fg={theme.muted}>writeFile — error: {invocation.errorText}</text>
                </AssistantToolFrame>
            );
        case "approval-requested":
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>writeFile — approval requested (not configured in this client)</text>
                </AssistantToolFrame>
            );
        case "approval-responded":
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>writeFile — approval responded</text>
                </AssistantToolFrame>
            );
        default:
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>writeFile — unknown state</text>
                </AssistantToolFrame>
            );
    }
}

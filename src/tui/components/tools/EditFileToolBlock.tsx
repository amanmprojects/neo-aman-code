import * as path from "node:path";
import { createTwoFilesPatch } from "diff";
import type { EditFileToolInvocation } from "../../../agent/tools/edit-file";
import { theme } from "../../theme";
import { AssistantToolFrame } from "../MessageFrames";

const FULL_DIFF_CONTEXT = Number.MAX_SAFE_INTEGER;

function filetypeForPath(filePath: string): string | undefined {
    const ext = path.extname(filePath).slice(1).toLowerCase();
    switch (ext) {
        case "ts":
        case "mts":
        case "cts":
            return "typescript";
        case "tsx":
            return "tsx";
        case "js":
        case "jsx":
        case "mjs":
        case "cjs":
            return "javascript";
        case "json":
            return "json";
        case "md":
        case "mdx":
            return "markdown";
        case "css":
            return "css";
        case "html":
        case "htm":
            return "html";
        case "py":
            return "python";
        case "rs":
            return "rust";
        case "go":
            return "go";
        case "sh":
        case "bash":
            return "bash";
        case "yml":
        case "yaml":
            return "yaml";
        default:
            return undefined;
    }
}

function EditFileDiffView({ filePath, patch }: { filePath: string; patch: string }) {
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

function toPatchPath(filePath: string, prefix: "a" | "b"): string {
    return `${prefix}/${filePath.replaceAll("\\", "/").replace(/^\/+/, "")}`;
}

function snippetPatch(filePath: string, oldString: string, newString: string): string {
    const normalizedPath = filePath || "file";
    return createTwoFilesPatch(
        toPatchPath(normalizedPath, "a"),
        toPatchPath(normalizedPath, "b"),
        oldString,
        newString,
        "original",
        "modified",
        {
        context: FULL_DIFF_CONTEXT,
        },
    );
}

function formatOutputHeader(output: NonNullable<EditFileToolInvocation["output"]>): string {
    if ("error" in output && typeof output.error === "string") {
        return output.error;
    }
    const n = output.replacedOccurrences;
    return `${output.filePath} — ${n} replacement${n === 1 ? "" : "s"}`;
}

export function EditFileToolBlock({ invocation }: { invocation: EditFileToolInvocation }) {
    switch (invocation.state) {
        case "input-streaming":
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>editFile — reading arguments…</text>
                </AssistantToolFrame>
            );
        case "input-available": {
            const fp = invocation.input.filePath ?? "(path)";
            const oldS = invocation.input.oldString ?? "";
            const newS = invocation.input.newString ?? "";
            const ra = invocation.input.replaceAll === true ? "replaceAll" : "single match";
            const patch = snippetPatch(fp, oldS, newS);
            return (
                <AssistantToolFrame border={["left"]}>
                    <box flexDirection="column" gap={1} minWidth={0} width="100%">
                        <text fg={theme.muted}>
                            editFile — {fp} ({ra})
                        </text>
                        <EditFileDiffView filePath={fp} patch={patch} />
                    </box>
                </AssistantToolFrame>
            );
        }
        case "output-available": {
            const out = invocation.output;
            if ("error" in out && typeof out.error === "string") {
                return (
                    <AssistantToolFrame border={["left"]}>
                        <text fg={theme.muted}>editFile — error: {out.error}</text>
                    </AssistantToolFrame>
                );
            }
            const fp = invocation.input.filePath ?? out.filePath;
            return (
                <AssistantToolFrame border={["left"]}>
                    <box flexDirection="column" gap={1} minWidth={0} width="100%">
                        <text fg={theme.muted}>editFile — {formatOutputHeader(out)}</text>
                        <EditFileDiffView filePath={fp} patch={out.diff} />
                    </box>
                </AssistantToolFrame>
            );
        }
        case "output-error":
            return (
                <AssistantToolFrame border={["left"]}>
                    <text fg={theme.muted}>editFile — error: {invocation.errorText}</text>
                </AssistantToolFrame>
            );
        case "approval-requested":
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>editFile — approval requested (not configured in this client)</text>
                </AssistantToolFrame>
            );
        case "approval-responded":
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>editFile — approval responded</text>
                </AssistantToolFrame>
            );
        default:
            return (
                <AssistantToolFrame border={false}>
                    <text fg={theme.muted}>editFile — unknown state</text>
                </AssistantToolFrame>
            );
    }
}

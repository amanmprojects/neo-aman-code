import type {
    TavilyExtractToolInvocation,
    TavilySearchToolInvocation,
} from "../../../agent/tools/tavily";
import { useVerbose } from "../../hooks/verbose";
import { theme } from "../../theme";
import { MessageFrame } from "../MessageFrame";

const MAX_RESULT_LINES = 6;
const MAX_BODY_LINES = 4;

function clipLines(text: string, maxLines: number): string[] {
    const lines = text.split("\n");
    if (lines.length <= maxLines) return lines;
    return [
        ...lines.slice(0, maxLines),
        `… ${lines.length - maxLines} more lines`,
    ];
}

function formatSearchOutput(
    output: NonNullable<TavilySearchToolInvocation["output"]>,
    verbose: boolean,
): string {
    if (output && typeof output === "object" && "error" in output) {
        return String((output as { error: unknown }).error);
    }
    const o = output as {
        query?: string;
        answer?: string;
        results?: Array<{ title: string; url: string; content?: string }>;
    };
    const n = o.results?.length ?? 0;
    const head = o.answer
        ? `tavilySearch — ${o.query ?? "?"} (${n} results)\nAnswer: ${o.answer}`
        : `tavilySearch — ${o.query ?? "?"} (${n} results)`;
    if (!verbose || !o.results?.length) return head;

    const lines = [head, ""];
    for (const r of o.results.slice(0, 5)) {
        lines.push(`• ${r.title}`);
        lines.push(`  ${r.url}`);
        if (r.content) {
            lines.push(...clipLines(r.content, 2).map((l) => `  ${l}`));
        }
    }
    if ((o.results?.length ?? 0) > 5) {
        lines.push(`… ${o.results!.length - 5} more results`);
    }
    return lines.join("\n");
}

export function TavilySearchToolBlock({ invocation }: { invocation: TavilySearchToolInvocation }) {
    const verbose = useVerbose();
    switch (invocation.state) {
        case "input-streaming":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>tavilySearch — reading arguments…</text>
                </MessageFrame>
            );
        case "input-available":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel}>
                    <text fg={theme.muted}>
                        tavilySearch — query: {invocation.input.query}
                    </text>
                </MessageFrame>
            );
        case "output-available":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel}>
                    <text fg={theme.muted}>{formatSearchOutput(invocation.output, verbose)}</text>
                </MessageFrame>
            );
        case "output-error":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel}>
                    <text fg={theme.muted}>tavilySearch — error: {invocation.errorText}</text>
                </MessageFrame>
            );
        case "approval-requested":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>tavilySearch — approval requested</text>
                </MessageFrame>
            );
        case "approval-responded":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>tavilySearch — approval responded</text>
                </MessageFrame>
            );
        default:
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>tavilySearch — unknown state</text>
                </MessageFrame>
            );
    }
}

function formatExtractOutput(
    output: NonNullable<TavilyExtractToolInvocation["output"]>,
    verbose: boolean,
): string {
    if (output && typeof output === "object" && "error" in output) {
        return String((output as { error: unknown }).error);
    }
    const o = output as {
        results?: Array<{ url: string; rawContent: string }>;
        failedResults?: Array<{ url: string; error: string }>;
    };
    const ok = o.results?.length ?? 0;
    const failed = o.failedResults?.length ?? 0;
    const head = `tavilyExtract — ${ok} page(s), ${failed} failed`;
    if (!verbose) return head;

    const lines = [head, ""];
    for (const r of o.results?.slice(0, MAX_RESULT_LINES) ?? []) {
        lines.push(r.url);
        lines.push(...clipLines(r.rawContent, MAX_BODY_LINES).map((l) => `  ${l}`));
        lines.push("");
    }
    for (const f of o.failedResults ?? []) {
        lines.push(`fail: ${f.url} — ${f.error}`);
    }
    return lines.join("\n").trimEnd();
}

export function TavilyExtractToolBlock({ invocation }: { invocation: TavilyExtractToolInvocation }) {
    const verbose = useVerbose();
    switch (invocation.state) {
        case "input-streaming":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>tavilyExtract — reading arguments…</text>
                </MessageFrame>
            );
        case "input-available": {
            const urls = invocation.input.urls ?? [];
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel}>
                    <text fg={theme.muted}>
                        tavilyExtract — {urls.length} URL(s) · {urls[0] ?? ""}
                        {urls.length > 1 ? " …" : ""}
                    </text>
                </MessageFrame>
            );
        }
        case "output-available":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel}>
                    <text fg={theme.muted}>{formatExtractOutput(invocation.output, verbose)}</text>
                </MessageFrame>
            );
        case "output-error":
            return (
                <MessageFrame border={["left"]} borderColor={theme.panel}>
                    <text fg={theme.muted}>tavilyExtract — error: {invocation.errorText}</text>
                </MessageFrame>
            );
        case "approval-requested":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>tavilyExtract — approval requested</text>
                </MessageFrame>
            );
        case "approval-responded":
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>tavilyExtract — approval responded</text>
                </MessageFrame>
            );
        default:
            return (
                <MessageFrame border={false}>
                    <text fg={theme.muted}>tavilyExtract — unknown state</text>
                </MessageFrame>
            );
    }
}

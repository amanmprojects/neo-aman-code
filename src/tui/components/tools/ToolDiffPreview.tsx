import { theme } from "../../theme";

/**
 * Strips unified diff down to hunk headers and added/removed lines only (no scrollable Diff widget).
 */
export function formatDiffChangedLinesOnly(diffText: string): string {
    const lines = diffText.split("\n");
    const out: string[] = [];
    for (const line of lines) {
        if (line.startsWith("\\")) {
            continue;
        }
        if (line.startsWith("@@")) {
            out.push(line);
            continue;
        }
        if (line.startsWith("+") || line.startsWith("-")) {
            if (line.startsWith("+++ ") || line.startsWith("--- ")) {
                continue;
            }
            out.push(line);
        }
    }
    return out.join("\n");
}

/**
 * Prints diff as plain text in the main message flow (no inner scroll region).
 */
export function ToolDiffPreview({
    diffText,
    maxChars = 24_000,
}: {
    diffText: string;
    maxChars?: number;
}) {
    if (!diffText.trim()) {
        return null;
    }

    let body = formatDiffChangedLinesOnly(diffText);
    let clipped = false;
    if (body.length > maxChars) {
        body = `${body.slice(0, maxChars)}\n… (${body.length - maxChars} more characters)`;
        clipped = true;
    }

    return (
        <box flexDirection="column" width="100%" minWidth={0} flexShrink={0}>
            <text fg={theme.dim}>
                {body}
                {clipped ? "\n(output clipped for display)" : ""}
            </text>
        </box>
    );
}

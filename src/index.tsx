import "./tui/assistantMarkdown";
import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./tui/App";

const renderer = await createCliRenderer();
renderer.on("selection", (selection) => {
    const text = selection.getSelectedText();
    if (!text?.trim()) return;
    void (async () => {
        type NavClip = { clipboard?: { writeText: (t: string) => Promise<void> } };
        const nav = globalThis.navigator as NavClip | undefined;
        try {
            if (nav?.clipboard?.writeText) {
                await nav.clipboard.writeText(text);
            } else {
                throw new Error("no navigator clipboard");
            }
        } catch {
            renderer.copyToClipboardOSC52(text);
        }
        renderer.clearSelection();
        renderer.requestRender();
    })();
});

createRoot(renderer).render(<App />);

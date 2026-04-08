import { useEffect, useState } from "react";
import { useChatSessionStatus } from "../hooks/chatSession";
import { theme } from "../theme";

/** Braille frames — reads as motion without a classic "spinner" block cursor. */
const BRAILLE = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const;

const PHRASES = [
    "Still on it—model or tools are running",
    "Working through your request",
    "Hang tight; this line vanishes when idle",
] as const;

const TICK_MS = 340;

/**
 * Shown above the chat input while the transport reports `submitted` or `streaming`
 * (covers tool calls, reasoning, and text generation).
 */
export function AgentActivityBar() {
    const status = useChatSessionStatus();
    const active = status === "streaming" || status === "submitted";
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (!active) {
            setTick(0);
            return;
        }
        const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
        return () => clearInterval(id);
    }, [active]);

    if (!active) {
        return null;
    }

    const glyph = BRAILLE[tick % BRAILLE.length];
    const phrase = PHRASES[Math.floor(tick / 14) % PHRASES.length];

    return (
        <box
            flexShrink={0}
            flexDirection="row"
            alignItems="center"
            paddingY={0}
            paddingX={0}
            marginBottom={0}
        >
            <text>
                <span fg={theme.accent}>{glyph}</span>
                <span fg={theme.muted}> {phrase}</span>
            </text>
        </box>
    );
}

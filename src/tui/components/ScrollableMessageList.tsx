import type { UIMessage } from "ai";
import { theme } from "../theme";
import { UserMessage } from "./UserMessage";


export function ScrollableMessageList({ messages }: { messages: UIMessage[] }) {
    return (
        <scrollbox
            flexGrow={1}
            minHeight={0}

            stickyScroll
            stickyStart="bottom"
            rootOptions={{ backgroundColor: theme.bg }}
            paddingRight={2}
        >
            <box flexDirection="column" paddingX={0} paddingY={1} gap={1}>
                {messages.map((m, i) => (
                    m.role === 'user'
                        ? <UserMessage key={i} message={m.parts.find((p) => p.type === "text")?.text ?? ""} />
                        : <text key={i} fg={theme.text} selectable>{m.parts.find((p) => p.type === "text")?.text ?? ""}</text>
                ))}
                <box>
                    <text fg={theme.text}>
                        <span fg={theme.accent}>▣</span>
                        {" Build · gpt-5.3-codex"}
                    </text>
                </box>
            </box>
        </scrollbox>
    );
}
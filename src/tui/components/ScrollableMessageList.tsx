import type { UIMessage } from "ai";
import { theme } from "../theme";
import { UserMessage } from "./UserMessage";
import { AssistantMessage } from "./AssistantMessage";
import { MessageFrame } from "./MessageFrame";
import type { borderCharsToArray } from "@opentui/core";


export function ScrollableMessageList({ messages }: { messages: UIMessage[] }) {
    return (
        <scrollbox
            flexGrow={1}
            minHeight={0}

            stickyScroll
            
            stickyStart="bottom"
            rootOptions={{ backgroundColor: theme.bg}}
            paddingRight={2}
        >
            <box flexDirection="column" paddingX={0} paddingY={1} gap={1}>
                {messages.map((m) => (
                    m.role === 'user'
                        ? <UserMessage key={m.id} message={m} />
                        : <AssistantMessage key={m.id} message={m} />
                ))}

                <MessageFrame border={['left']} borderColor={theme.bg}>
                    <text fg={theme.text}>
                        <span fg={theme.accent}>▣</span>
                        {" Build · gpt-5.3-codex"}
                    </text>
                </MessageFrame>
            </box>
        </scrollbox>
    );
}
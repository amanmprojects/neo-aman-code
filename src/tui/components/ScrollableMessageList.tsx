import type { UIMessage } from "ai";
import type { ScrollAcceleration } from "@opentui/core";
import { theme } from "../theme";
import { UserMessage } from "./UserMessage";
import { AssistantMessage } from "./AssistantMessage";
import { MessageFrame } from "./MessageFrame";
import { useChatSessionStatus } from "../hooks/chatSession";

type ScrollableMessageListProps = {
    messages: UIMessage[];
    modelName: string;
};

/** Wheel / trackpad delta multiplier (OpenTUI default is 1). */
const MESSAGE_LIST_SCROLL_MULTIPLIER = 5;

const messageListScrollAcceleration: ScrollAcceleration = {
    tick() {
        return MESSAGE_LIST_SCROLL_MULTIPLIER;
    },
    reset() {},
};

export function ScrollableMessageList({ messages, modelName }: ScrollableMessageListProps) {
    const chatStatus = useChatSessionStatus();
    const lastId = messages[messages.length - 1]?.id;
    const liveTurn =
        chatStatus === "streaming" || chatStatus === "submitted";

    return (
        <scrollbox
            flexGrow={1}
            minHeight={0}
            stickyScroll
            stickyStart="bottom"
            scrollAcceleration={messageListScrollAcceleration}
            rootOptions={{ backgroundColor: theme.bg }}
            paddingRight={2}
        >
            <box flexDirection="column" paddingX={0} paddingY={1} gap={1} minWidth={0} width="100%">
                {messages.map((m) => {
                    const markdownStreaming = liveTurn && m.id === lastId && m.role === "assistant";
                    const role = m.role;
                    if (role === "user") {
                        return <UserMessage key={m.id} message={m} />;
                    }
                    if (role === "assistant") {
                        return (
                            <AssistantMessage
                                key={m.id}
                                message={m}
                                markdownStreaming={markdownStreaming}
                            />
                        );
                    }
                    if (role === "system") {
                        return null;
                    }
                    return (
                        <MessageFrame key={m.id} border={false}>
                            <text fg={theme.muted}>Unknown message role: {role}</text>
                        </MessageFrame>
                    );
                })}

                <MessageFrame border={['left']} borderColor={theme.bg}>
                    <text fg={theme.text}>
                        <span fg={theme.accent}>▣</span>
                        {` Build · ${modelName}`}
                    </text>
                </MessageFrame>
            </box>
        </scrollbox>
    );
}

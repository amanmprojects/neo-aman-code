import type { TextUIPart, UIMessage } from "ai";
import { theme } from "../theme";
import { MessageFrame } from "./MessageFrame";

function UserTextPart({ part, index }: { part: TextUIPart, index: number }) {
    return (
        <MessageFrame key={index}
            borderColor={theme.accent}
            border={["left"]}
            backgroundColor={theme.stripBar}
            paddingY={1}
        >

            <text fg={theme.text}>{part.text}</text>

        </MessageFrame>
    );
}

function UserUnknownPart({ part, index }: { part: UIMessage['parts'][number], index: number }) {
    return (
        <MessageFrame key={index} borderColor={theme.accent}>
            <text fg={theme.muted}>Unknown part type: {part.type}</text>
        </MessageFrame>
    );
}

export function UserMessage({ message }: { message: UIMessage }) {
    return (
        <box flexDirection="column" gap={1} flexShrink={0}>
            {message.parts.map((part, index) => {
                switch (part.type) {
                    case "text":
                        return (
                            <UserTextPart part={part} index={index} />
                        );
                    default:
                        return (
                            <UserUnknownPart part={part} index={index} />
                        )
                }
            })}
        </box>
    );
}

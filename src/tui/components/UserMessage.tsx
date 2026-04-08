import type { TextUIPart } from "ai";
import type { AgentUIMessage } from "../../agent";
import { theme } from "../theme";
import { MessageFrame } from "./MessageFrame";

function UserTextPart({ part }: { part: TextUIPart }) {
    return (
        <MessageFrame
            borderColor={theme.accent}
            border={["left"]}
            backgroundColor={theme.stripBar}
            paddingY={1}
            borderStyle="heavy"
        >

            <text fg={theme.text}>{part.text}</text>

        </MessageFrame>
    );
}

function UserUnknownPart({ part }: { part: AgentUIMessage["parts"][number] }) {
    return (
        <MessageFrame borderColor={theme.accent}>
            <text fg={theme.muted}>Unknown part type: {part.type}</text>
        </MessageFrame>
    );
}

export function UserMessage({ message }: { message: AgentUIMessage }) {
    return (
        <box flexDirection="column" gap={1} flexShrink={0}>
            {message.parts.map((part, index) => {
                const key = `${part.type}-${index}`;
                switch (part.type) {
                    case "text":
                        return (
                            <UserTextPart key={key} part={part} />
                        );
                    default:
                        return (
                            <UserUnknownPart key={key} part={part} />
                        )
                }
            })}
        </box>
    );
}

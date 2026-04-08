import type { TextUIPart } from "ai";
import type { AgentUIMessage } from "../../agent";
import { theme } from "../theme";
import { UserMessageFrame } from "./MessageFrames";

function UserTextPart({ part }: { part: TextUIPart }) {
    return (
        <UserMessageFrame>
            <text fg={theme.text}>{part.text}</text>
        </UserMessageFrame>
    );
}

function UserUnknownPart({ part }: { part: AgentUIMessage["parts"][number] }) {
    return (
        <UserMessageFrame variant="unknown">
            <text fg={theme.muted}>Unknown part type: {part.type}</text>
        </UserMessageFrame>
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

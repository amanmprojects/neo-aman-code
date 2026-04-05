import { theme } from "../theme";
import type { DynamicToolUIPart, ReasoningUIPart, TextUIPart, UIMessage } from "ai";
import { MessageFrame } from "./MessageFrame";
import { SyntaxStyle , RGBA} from "@opentui/core";


function AssistantReasoningPart({ part, index }: { part: ReasoningUIPart, index: number }) {
    const syntaxStyle = SyntaxStyle.fromStyles({
        "markup.heading.1": { fg: RGBA.fromHex("#58A6FF"), bold: true },
        default: {fg: RGBA.fromHex(theme.muted)}
    })
    return (
        <MessageFrame key={index} 
        borderColor={theme.panel}
        border={["left"]}>
            {/* <text fg={theme.muted}>{part.text}</text> */}
            <markdown content={part.text} syntaxStyle={syntaxStyle} />
        </MessageFrame>
    );
}

function AssistantDynamicToolPart({ part, index }: { part: DynamicToolUIPart, index: number }) {
    return (
        <MessageFrame key={index} border={false}>
            <text fg={theme.muted}>{part.toolName}: {part.state}</text>
        </MessageFrame>
    );
}

function AssistantTextPart({ part, index }: { part: TextUIPart, index: number }) {
    const syntaxStyle = SyntaxStyle.fromStyles({
        "markup.heading.1": { fg: RGBA.fromHex("#58A6FF"), bold: true },
        default: {fg: RGBA.fromHex(theme.text)}
    })
    return (
        <MessageFrame key={index} 
        border={["left"]}
        borderColor={theme.bg}>
            {/* <text fg={theme.text}>{part.text}</text> */}
            <markdown content={part.text} syntaxStyle={syntaxStyle} />
        </MessageFrame>
    );
}

function AssistantUnknownPart({ part, index }: { part: UIMessage['parts'][number], index: number }) {
    return (
        <MessageFrame key={index} border={false}>
            <text fg={theme.muted}>Unknown part type: {part.type}</text>
        </MessageFrame>
    );
}


export function AssistantMessage({ message }: { message: UIMessage }) {
    return (
        <box flexDirection="column" gap={1} flexShrink={0}>
            {message.parts.map((part, index) => {
                switch (part.type) {
                    case "text":
                        return (
                                <AssistantTextPart part={part} index={index} />
                        );
                    case "reasoning":
                        return (
                                <AssistantReasoningPart part={part} index={index} />
                        );
                    case "dynamic-tool":
                        return (
                                <AssistantDynamicToolPart part={part} index={index} />
                        );
                    case 'step-start':
                        return null;
                    default:
                        return (
                            <AssistantUnknownPart part={part} index={index} />
                        )
                }
            })}
        </box>
    );
}

import { Fragment } from "react";
import { theme } from "../theme";
import type { DynamicToolUIPart, ReasoningUIPart, TextUIPart, UIMessage } from "ai";
import { MessageFrame } from "./MessageFrame";
import { syntaxStyleForAssistantMarkdown } from "../assistantMarkdown";

const markdownSyntaxBody = syntaxStyleForAssistantMarkdown("body");
const markdownSyntaxReasoning = syntaxStyleForAssistantMarkdown("reasoning");

function AssistantReasoningPart({
    part,
    streaming,
}: {
    part: ReasoningUIPart;
    streaming: boolean;
}) {
    return (
        <MessageFrame borderColor={theme.panel} border={["left"]}>
            <markdown
                content={part.text}
                syntaxStyle={markdownSyntaxReasoning}
                streaming={streaming}
            />
        </MessageFrame>
    );
}

function AssistantDynamicToolPart({ part }: { part: DynamicToolUIPart }) {
    return (
        <MessageFrame border={false}>
            <text fg={theme.muted}>
                {part.toolName}: {part.state}
            </text>
        </MessageFrame>
    );
}

function AssistantTextPart({
    part,
    streaming,
}: {
    part: TextUIPart;
    streaming: boolean;
}) {
    return (
        <MessageFrame border={["left"]} borderColor={theme.bg}>
            <markdown
                content={part.text}
                syntaxStyle={markdownSyntaxBody}
                streaming={streaming}
            />
        </MessageFrame>
    );
}

function AssistantUnknownPart({ part }: { part: UIMessage["parts"][number] }) {
    return (
        <MessageFrame border={false}>
            <text fg={theme.muted}>Unknown part type: {part.type}</text>
        </MessageFrame>
    );
}

export function AssistantMessage({
    message,
    markdownStreaming,
}: {
    message: UIMessage;
    markdownStreaming: boolean;
}) {
    return (
        <box flexDirection="column" gap={1} flexShrink={0} minWidth={0} width="100%">
            {message.parts.map((part, index) => {
                const key = `${part.type}-${index}`;
                switch (part.type) {
                    case "text":
                        return (
                            <AssistantTextPart
                                key={key}
                                part={part}
                                streaming={markdownStreaming}
                            />
                        );
                    case "reasoning":
                        return (
                            <AssistantReasoningPart
                                key={key}
                                part={part}
                                streaming={markdownStreaming}
                            />
                        );
                    case "dynamic-tool":
                        return <AssistantDynamicToolPart key={key} part={part} />;
                    case "step-start":
                        return <Fragment key={key} />;
                    default:
                        return <AssistantUnknownPart key={key} part={part} />;
                }
            })}
        </box>
    );
}

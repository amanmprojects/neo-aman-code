import { theme } from "../theme";
import type { ReasoningUIPart, TextUIPart } from "ai";
import type { AgentUIMessage } from "../../agent";
import { MessageFrame } from "./MessageFrame";
import { syntaxStyleForAssistantMarkdown } from "../assistantMarkdown";
import { BashToolBlock } from "./tools/BashToolBlock";
import { EditFileToolBlock } from "./tools/EditFileToolBlock";
import { GlobSearchToolBlock } from "./tools/GlobSearchToolBlock";
import { GrepSearchToolBlock } from "./tools/GrepSearchToolBlock";
import { ListDirToolBlock } from "./tools/ListDirToolBlock";
import { ReadFileToolBlock } from "./tools/ReadFileToolBlock";
import { TavilyExtractToolBlock, TavilySearchToolBlock } from "./tools/TavilyToolBlocks";
import { WriteFileToolBlock } from "./tools/WriteFileToolBlock";

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
        <MessageFrame borderColor={theme.panel} border={["left"]} borderStyle="heavy">
            <markdown
                content={part.text}
                syntaxStyle={markdownSyntaxReasoning}
                streaming={streaming}
            />
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

function AssistantUnknownPart({ part }: { part: AgentUIMessage["parts"][number] }) {
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
    message: AgentUIMessage;
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
                    case "tool-listDir":
                        return <ListDirToolBlock key={key} invocation={part} />;
                    case "tool-readFile":
                        return <ReadFileToolBlock key={key} invocation={part} />;
                    case "tool-writeFile":
                        return <WriteFileToolBlock key={key} invocation={part} />;
                    case "tool-editFile":
                        return <EditFileToolBlock key={key} invocation={part} />;
                    case "tool-bash":
                        return <BashToolBlock key={key} invocation={part} />;
                    case "tool-grepSearch":
                        return <GrepSearchToolBlock key={key} invocation={part} />;
                    case "tool-globSearch":
                        return <GlobSearchToolBlock key={key} invocation={part} />;
                    case "tool-tavilySearch":
                        return <TavilySearchToolBlock key={key} invocation={part} />;
                    case "tool-tavilyExtract":
                        return <TavilyExtractToolBlock key={key} invocation={part} />;
                    case "step-start":
                        return null;
                    default:
                        return <AssistantUnknownPart key={key} part={part} />;
                }
            })}
        </box>
    );
}

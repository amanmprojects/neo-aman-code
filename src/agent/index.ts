import { ToolLoopAgent, type InferAgentUIMessage } from "ai";
import { toolSet } from "./tools";
import { AGENT_MODEL } from "./modelLabel";

const agent = new ToolLoopAgent({
    model: AGENT_MODEL,
    tools: toolSet,
    instructions: `You are a helpful assistant that can answer questions and help with tasks. You are in the workspace directory ${process.cwd()}.`,
});

type AgentUIMessage = InferAgentUIMessage<typeof agent>;

export type { AgentUIMessage };
export { agent };
export { AGENT_MODEL, AGENT_MODEL_LABEL, languageModelLabel } from "./modelLabel";

import { ToolLoopAgent, type InferAgentUIMessage } from "ai";
import { toolSet } from "./tools";
import { DEFAULT_MODEL, litellm } from "./providers";

const agent = new ToolLoopAgent({
    model: litellm(DEFAULT_MODEL),
    tools: toolSet,
    instructions: `You are a helpful assistant that can answer questions and help with tasks. You are in the workspace directory ${process.cwd()}.`,
});

type AgentUIMessage = InferAgentUIMessage<typeof agent>;

export type { AgentUIMessage };
export { agent };

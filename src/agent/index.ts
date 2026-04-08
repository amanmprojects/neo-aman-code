import { ToolLoopAgent, type InferAgentUIMessage } from "ai";
import { toolSet } from "./tools";
import { MODEL_LIST} from "./providers";

const agent = new ToolLoopAgent({
    model: MODEL_LIST[1]!,
    tools: toolSet,
    instructions: `You are a helpful assistant that can answer questions and help with tasks. You are in the workspace directory ${process.cwd()}.`,
});

type AgentUIMessage = InferAgentUIMessage<typeof agent>;

export type { AgentUIMessage };
export { agent };

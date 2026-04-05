import { ToolLoopAgent, type InferAgentUIMessage } from "ai";
import { toolSet } from "./tools";
import { DEFAULT_MODEL, litellm } from "./providers";


const agent = new ToolLoopAgent({
    model: litellm(DEFAULT_MODEL),
    tools: toolSet,
    instructions:
        `You are a helpful assistant that can answer questions and help with tasks. You can use listDir to list directory contents and readFile to read text files on the local filesystem (within tool limits).\
        You are currently in the directory ${process.cwd()}.`,
});

type AgentUIMessage = InferAgentUIMessage<typeof agent>;


export type { AgentUIMessage };
export { agent };

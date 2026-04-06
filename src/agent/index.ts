import { ToolLoopAgent, type InferAgentUIMessage } from "ai";
import { toolSet } from "./tools";
import { DEFAULT_MODEL, litellm } from "./providers";

const agent = new ToolLoopAgent({
    model: litellm(DEFAULT_MODEL),
    tools: toolSet,
    instructions: `You are a helpful assistant that can answer questions and help with tasks. You are in the workspace directory ${process.cwd()}.

When using the bash tool, always set timeoutMs to a value that fits the command: quick commands ~30_000–120_000 ms; package installs and builds often need 300_000–600_000 ms or more (cap at the tool maximum). Prefer bun for installs in this project when appropriate.`,
});

type AgentUIMessage = InferAgentUIMessage<typeof agent>;

export type { AgentUIMessage };
export { agent };

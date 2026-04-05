import { ToolLoopAgent } from "ai";
import { DEFAULT_MODEL, litellm } from "./providers";

const agent = new ToolLoopAgent({
    model: litellm(DEFAULT_MODEL),
    tools: {},
    instructions: "You are a helpful assistant that can answer questions and help with tasks.",
});

export { agent };

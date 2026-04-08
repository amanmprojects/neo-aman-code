import { ToolLoopAgent, type InferAgentUIMessage } from "ai";
import { toolSet } from "./tools";
import { AGENT_MODEL } from "./modelLabel";

function sanitizePromptPath(filePath: string): string {
    return filePath.replace(/[\u0000-\u001f\u007f]+/g, "");
}

const workspacePath = sanitizePromptPath(process.cwd());

const agent = new ToolLoopAgent({
    model: AGENT_MODEL,
    tools: toolSet,
    instructions: `You are a helpful assistant that can answer questions and help with tasks. Workspace absolute path: ${workspacePath}.

Always pass absolute paths to tools. If a tool returns an absolute path, reuse it verbatim in later tool calls. Some tools may still accept relative paths for compatibility by resolving them against the workspace, but you should not rely on that behavior and should not intentionally send relative paths.

When using tools, multiple tool calls in the same assistant turn run concurrently (in parallel), not in the order they appear. If one tool depends on another having finished first, you must split them across separate turns: complete the first tool call, wait for its result, then invoke the dependent tool in a later step.
Example: do not call writeFile and editFile on the same path in one turn—editFile may run before the file exists and fail with "File not found". First call writeFile and receive success; only then call editFile in a subsequent step.`,
});

type AgentUIMessage = InferAgentUIMessage<typeof agent>;

export type { AgentUIMessage };
export { agent };
export { AGENT_MODEL, AGENT_MODEL_LABEL, languageModelLabel } from "./modelLabel";

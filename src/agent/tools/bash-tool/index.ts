import { createBashTool } from "bash-tool";

const bashToolkit = await createBashTool({
    destination: process.cwd(),
});

/** Bash execute tool for the agent tool set (sandbox / shell; see bash-tool AGENTS.md). */
export const bash = bashToolkit.bash;

export { bashToolkit };


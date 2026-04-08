import type { ToolSet } from "ai";
import { bash } from "./bash-tool";
import { editFile } from "./edit-file";
import { listDir } from "./list-dir";
import { readFile } from "./read-file";
import { createTavilyTools } from "./tavily";

export const toolSet = {
    listDir,
    readFile,
    editFile,
    bash,
    ...createTavilyTools(),
} as ToolSet;

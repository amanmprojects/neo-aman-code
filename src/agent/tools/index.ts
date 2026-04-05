import type { ToolSet } from "ai";
import { listDir } from "./list-dir";
import { readFile } from "./read-file";
import { createTavilyTools } from "./tavily";

export const toolSet = {
    listDir,
    readFile,
    ...createTavilyTools(),
} as ToolSet;

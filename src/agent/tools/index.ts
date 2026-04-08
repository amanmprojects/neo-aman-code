import type { ToolSet } from "ai";
import { bashTool } from "./bash-tool";
import { editFile } from "./edit-file";
import { listDir } from "./list-dir";
import { readFile } from "./read-file";
import { createTavilyTools } from "./tavily/tavily";
import { globSearch } from "./glob-search";
import { grepSearch } from "./grep-search";
import { writeFile } from "./write-file";

export const toolSet = {
    listDir,
    readFile,
    writeFile,
    editFile,
    ...createTavilyTools(),
    bashTool,
    globSearch,
    grepSearch,
} as ToolSet;

import type { ToolSet } from "ai";
import { bash } from "./bash-tool";
import { editFile } from "./edit-file";
import { globSearch } from "./glob-search";
import { grepSearch } from "./grep-search";
import { listDir } from "./list-dir";
import { readFile } from "./read-file";
import { createTavilyTools } from "./tavily";
import { writeFile } from "./write-file";

export const toolSet = {
    listDir,
    readFile,
    editFile,
    writeFile,
    bash,
    grepSearch,
    globSearch,
    ...createTavilyTools(),
} as ToolSet;

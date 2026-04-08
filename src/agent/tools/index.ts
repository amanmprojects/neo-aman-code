import type { ToolSet } from "ai";
import { bashTool } from "./bash-tool";
import { editFile } from "./edit-file";
import { listDir } from "./list-dir";
import { readFile } from "./read-file";
import { createTavilyTools } from "./tavily/tavily";
import { globSearch } from "./glob-search";
import { grepSearch } from "./grep-search";
import { taskCreate } from "./task/create";
import { taskGet } from "./task/get";
import { taskList } from "./task/list";
import { taskUpdate } from "./task/update";
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
    taskCreate,
    taskGet,
    taskList,
    taskUpdate,
} as ToolSet;

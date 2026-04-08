import * as path from "node:path";

export function filetypeForPath(filePath: string): string | undefined {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  switch (ext) {
    case "ts":
    case "mts":
    case "cts":
      return "typescript";
    case "tsx":
      return "tsx";
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      return "javascript";
    case "json":
      return "json";
    case "md":
    case "mdx":
      return "markdown";
    case "css":
      return "css";
    case "html":
    case "htm":
      return "html";
    case "py":
      return "python";
    case "rs":
      return "rust";
    case "go":
      return "go";
    case "sh":
    case "bash":
      return "bash";
    case "yml":
    case "yaml":
      return "yaml";
    default:
      return undefined;
  }
}

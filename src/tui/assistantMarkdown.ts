import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  RGBA,
  SyntaxStyle,
  addDefaultParsers,
  type FiletypeParserOptions,
  type StyleDefinition,
} from "@opentui/core";
import { theme } from "./theme";

const hex = (s: string) => RGBA.fromHex(s);

const projectRoot = path.join(fileURLToPath(new URL("../..", import.meta.url)));
const wasmDir = path.join(projectRoot, "node_modules/tree-sitter-wasms/out");

type Lang = {
  filetype: string;
  /** Relative name under `tree-sitter-wasms/out` (omit if `wasmPath` is set). */
  wasm?: string;
  wasmPath?: string;
  highlights: string;
  aliases?: string[];
};

const extraLangs: Lang[] = [
  {
    filetype: "python",
    wasm: "tree-sitter-python.wasm",
    highlights:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-python/master/queries/highlights.scm",
  },
  {
    filetype: "css",
    wasm: "tree-sitter-css.wasm",
    highlights:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-css/master/queries/highlights.scm",
  },
  {
    filetype: "bash",
    wasm: "tree-sitter-bash.wasm",
    highlights:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-bash/master/queries/highlights.scm",
    aliases: ["shell"],
  },
  {
    filetype: "html",
    wasm: "tree-sitter-html.wasm",
    highlights:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-html/master/queries/highlights.scm",
  },
  {
    filetype: "json",
    wasm: "tree-sitter-json.wasm",
    highlights:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-json/master/queries/highlights.scm",
  },
  {
    filetype: "go",
    wasm: "tree-sitter-go.wasm",
    highlights:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-go/master/queries/highlights.scm",
  },
  {
    filetype: "rust",
    wasm: "tree-sitter-rust.wasm",
    // Pin to tree-sitter-wasms grammar version (master queries use newer node names).
    highlights:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-rust/v0.20.4/queries/highlights.scm",
  },
  {
    filetype: "java",
    wasm: "tree-sitter-java.wasm",
    highlights:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-java/master/queries/highlights.scm",
  },
  {
    filetype: "ruby",
    wasm: "tree-sitter-ruby.wasm",
    highlights:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-ruby/master/queries/highlights.scm",
  },
  {
    filetype: "php",
    wasm: "tree-sitter-php.wasm",
    highlights:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-php/master/queries/highlights.scm",
  },
  {
    filetype: "cpp",
    wasm: "tree-sitter-cpp.wasm",
    highlights:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-cpp/v0.20.4/queries/highlights.scm",
  },
  {
    filetype: "c",
    wasm: "tree-sitter-c.wasm",
    highlights:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-c/master/queries/highlights.scm",
  },
  {
    filetype: "csharp",
    wasm: "tree-sitter-c_sharp.wasm",
    highlights:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-c-sharp/v0.20.0/queries/highlights.scm",
  },
  {
    filetype: "sql",
    wasmPath: path.join(projectRoot, "node_modules/@lumis-sh/wasm-sql/tree-sitter-sql.wasm"),
    highlights: path.join(
      projectRoot,
      "node_modules/@derekstride/tree-sitter-sql/queries/highlights.scm",
    ),
  },
  {
    filetype: "toml",
    wasm: "tree-sitter-toml.wasm",
    highlights:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-toml/master/queries/highlights.scm",
  },
];

const extraParsers: FiletypeParserOptions[] = extraLangs.map(
  ({ filetype, wasm, wasmPath, highlights, aliases }) => ({
    filetype,
    aliases,
    wasm: wasmPath ?? path.join(wasmDir, wasm!),
    queries: { highlights: [highlights] },
  }),
);

addDefaultParsers(extraParsers);

function markdownScopeStyles(defaultFg: RGBA): Record<string, StyleDefinition> {
  const accent = hex(theme.accent);
  const orange = hex(theme.orange);
  const green = hex(theme.green);
  const muted = hex(theme.muted);
  const dim = hex(theme.dim);

  return {
    default: { fg: defaultFg },

    "markup.heading": { fg: accent, bold: true },
    "markup.heading.1": { fg: hex("#58A6FF"), bold: true },
    "markup.heading.2": { fg: hex("#6BA3FF"), bold: true },
    "markup.heading.3": { fg: hex("#7B99E8"), bold: true },
    "markup.heading.4": { fg: accent, bold: true },
    "markup.heading.5": { fg: accent, bold: true, dim: true },
    "markup.heading.6": { fg: muted, bold: true },

    "markup.strong": { fg: defaultFg, bold: true },
    "markup.italic": { fg: defaultFg, italic: true },
    "markup.strikethrough": { fg: muted, dim: true },

    "markup.raw": { fg: orange },
    "markup.raw.block": { fg: defaultFg },

    "markup.link": { fg: accent, underline: true },
    "markup.link.url": { fg: hex("#79B8FF"), underline: true },
    "markup.link.label": { fg: accent },
    "markup.link.bracket.close": { fg: muted },

    "markup.list": { fg: muted },
    "markup.list.checked": { fg: green },
    "markup.list.unchecked": { fg: muted },

    "markup.quote": {
      fg: hex("#c8c8c8"),
      italic: true,
      bg: hex(theme.panel),
    },

    "punctuation.special": { fg: accent, dim: true, bold: true },

    comment: { fg: hex("#8b949e"), italic: true },
    string: { fg: hex("#a5d6ff") },
    keyword: { fg: hex("#ff7b72") },
    operator: { fg: hex("#ff7b72") },
    number: { fg: hex("#79c0ff") },
    boolean: { fg: hex("#79c0ff") },
    type: { fg: hex("#ffa657") },
    variable: { fg: defaultFg },
    function: { fg: hex("#d2a8ff") },
    method: { fg: hex("#d2a8ff") },
    property: { fg: hex("#79c0ff") },
    attribute: { fg: hex("#ff7b72") },
    constant: { fg: hex("#79c0ff") },
    namespace: { fg: defaultFg },
    tag: { fg: hex("#7ee787") },
    punctuation: { fg: hex("#8b949e") },

    conceal: { fg: dim },
    label: { fg: orange },
    "punctuation.delimiter": { fg: muted },
    "string.escape": { fg: orange },
    "keyword.directive": { fg: orange },
    "character.special": { fg: orange },
  };
}

export function syntaxStyleForAssistantMarkdown(variant: "body" | "reasoning"): SyntaxStyle {
  const defaultFg = hex(variant === "body" ? theme.text : theme.muted);
  return SyntaxStyle.fromStyles(markdownScopeStyles(defaultFg));
}

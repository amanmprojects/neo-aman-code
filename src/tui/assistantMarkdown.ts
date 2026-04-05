import fs from "node:fs";
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
const bundledHighlightsDir = path.join(projectRoot, "src/tui/bundled-tree-sitter-queries");

/** Grammar bundled via `tree-sitter-wasms` with repo-local highlights + remote fallback. */
type LangBundledWasm = {
  kind: "bundled";
  filetype: string;
  wasm: string;
  wasmPath?: never;
  highlightsRemote: string;
  aliases?: string[];
};

/** Wasm and highlights loaded from explicit paths (e.g. npm packages). */
type LangExplicitWasmPath = {
  kind: "explicit";
  filetype: string;
  wasmPath: string;
  wasm?: never;
  highlights: string;
  aliases?: string[];
};

type Lang = LangBundledWasm | LangExplicitWasmPath;

function resolveHighlightPath(localPath: string, remoteFallback: string): string {
  if (fs.existsSync(localPath)) {
    return localPath;
  }
  console.warn(
    `[assistantMarkdown] Local highlights missing at ${localPath}; falling back to remote (requires network).`,
  );
  return remoteFallback;
}

const extraLangs: Lang[] = [
  {
    kind: "bundled",
    filetype: "python",
    wasm: "tree-sitter-python.wasm",
    highlightsRemote:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-python/master/queries/highlights.scm",
  },
  {
    kind: "bundled",
    filetype: "css",
    wasm: "tree-sitter-css.wasm",
    highlightsRemote:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-css/master/queries/highlights.scm",
  },
  {
    kind: "bundled",
    filetype: "bash",
    wasm: "tree-sitter-bash.wasm",
    highlightsRemote:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-bash/master/queries/highlights.scm",
    aliases: ["shell"],
  },
  {
    kind: "bundled",
    filetype: "html",
    wasm: "tree-sitter-html.wasm",
    highlightsRemote:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-html/master/queries/highlights.scm",
  },
  {
    kind: "bundled",
    filetype: "json",
    wasm: "tree-sitter-json.wasm",
    highlightsRemote:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-json/master/queries/highlights.scm",
  },
  {
    kind: "bundled",
    filetype: "go",
    wasm: "tree-sitter-go.wasm",
    highlightsRemote:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-go/master/queries/highlights.scm",
  },
  {
    kind: "bundled",
    filetype: "rust",
    wasm: "tree-sitter-rust.wasm",
    highlightsRemote:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-rust/v0.20.4/queries/highlights.scm",
  },
  {
    kind: "bundled",
    filetype: "java",
    wasm: "tree-sitter-java.wasm",
    highlightsRemote:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-java/master/queries/highlights.scm",
  },
  {
    kind: "bundled",
    filetype: "ruby",
    wasm: "tree-sitter-ruby.wasm",
    highlightsRemote:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-ruby/master/queries/highlights.scm",
  },
  {
    kind: "bundled",
    filetype: "php",
    wasm: "tree-sitter-php.wasm",
    highlightsRemote:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-php/master/queries/highlights.scm",
  },
  {
    kind: "bundled",
    filetype: "cpp",
    wasm: "tree-sitter-cpp.wasm",
    highlightsRemote:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-cpp/v0.20.4/queries/highlights.scm",
  },
  {
    kind: "bundled",
    filetype: "c",
    wasm: "tree-sitter-c.wasm",
    highlightsRemote:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-c/master/queries/highlights.scm",
  },
  {
    kind: "bundled",
    filetype: "csharp",
    wasm: "tree-sitter-c_sharp.wasm",
    highlightsRemote:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-c-sharp/v0.20.0/queries/highlights.scm",
  },
  {
    kind: "explicit",
    filetype: "sql",
    wasmPath: path.join(projectRoot, "node_modules/@lumis-sh/wasm-sql/tree-sitter-sql.wasm"),
    highlights: path.join(
      projectRoot,
      "node_modules/@derekstride/tree-sitter-sql/queries/highlights.scm",
    ),
  },
  {
    kind: "bundled",
    filetype: "toml",
    wasm: "tree-sitter-toml.wasm",
    highlightsRemote:
      "https://raw.githubusercontent.com/tree-sitter/tree-sitter-toml/master/queries/highlights.scm",
  },
  {
    kind: "bundled",
    filetype: "yaml",
    wasm: "tree-sitter-yaml.wasm",
    highlightsRemote:
      "https://raw.githubusercontent.com/helix-editor/helix/master/runtime/queries/yaml/highlights.scm",
    aliases: ["yml"],
  },
];

const extraParsers: FiletypeParserOptions[] = extraLangs.map((lang) => {
  if (lang.kind === "explicit") {
    return {
      filetype: lang.filetype,
      aliases: lang.aliases,
      wasm: lang.wasmPath,
      queries: { highlights: [lang.highlights] },
    };
  }
  const localHighlights = path.join(bundledHighlightsDir, `${lang.filetype}.scm`);
  return {
    filetype: lang.filetype,
    aliases: lang.aliases,
    wasm: path.join(wasmDir, lang.wasm),
    queries: {
      highlights: [resolveHighlightPath(localHighlights, lang.highlightsRemote)],
    },
  };
});

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

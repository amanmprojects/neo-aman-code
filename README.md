# neo-aman-code

A terminal-based AI coding assistant with a rich TUI, built with [OpenTUI](https://opentui.dev), [React](https://react.dev), and the [Vercel AI SDK](https://ai-sdk.dev).

## Features

- **Interactive TUI** — Full terminal UI with chat interface, sidebar, command bar, and scrollable message list
- **AI Agent** — Tool-loop agent powered by the AI SDK with support for multi-step reasoning (up to 100 steps)
- **File Operations** — Read, write, and edit files directly from the agent
- **Code Search** — Glob and grep search across your workspace
- **Shell Access** — Run bash commands through the agent
- **Web Search** — Tavily-powered web search integration
- **Task Management** — Create, list, get, and update tasks during agent sessions
- **Markdown Rendering** — Rich markdown rendering with syntax highlighting via Tree-sitter
- **Clipboard Support** — Copy text selections via navigator clipboard or OSC 52

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) runtime

### Install

```bash
bun install
```

### Run

```bash
bun dev
```

## Architecture

```
src/
├── index.tsx              # Entry point — sets up CLI renderer and React root
├── agent/
│   ├── index.ts           # ToolLoopAgent definition and system prompt
│   ├── modelLabel.ts      # Model label resolution
│   ├── path-guards.ts     # Path sanitization utilities
│   └── tools/             # Agent tool implementations
│       ├── bash-tool/     # Shell command execution
│       ├── edit-file/     # File editing
│       ├── read-file/     # File reading
│       ├── write-file/    # File writing
│       ├── list-dir/      # Directory listing
│       ├── glob-search/   # Glob pattern search
│       ├── grep-search/   # Regex content search
│       ├── tavily/        # Web search (Tavily)
│       └── task/          # Task management (create/get/list/update)
└── tui/
    ├── App.tsx            # Main app shell with chat state management
    ├── assistantMarkdown.ts  # Markdown rendering with Tree-sitter
    ├── theme.ts           # Theme configuration
    ├── commands/          # Command bar commands
    ├── components/        # UI components (messages, sidebar, footer, etc.)
    ├── hooks/             # React hooks (chat session, layout, model, task state, verbose)
    └── pages/             # NewChatPage and ChatPage views
```

## Tech Stack

- **Runtime**: Bun
- **TUI Framework**: OpenTUI (core + React reconciler)
- **AI**: Vercel AI SDK (`ai`, `@ai-sdk/openai-compatible`, `@ai-sdk/react`)
- **Syntax Highlighting**: Tree-sitter (web-tree-sitter + tree-sitter-wasms)
- **Web Search**: Tavily (`@tavily/ai-sdk`)
- **Validation**: Zod

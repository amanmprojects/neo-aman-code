import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useCallback, useMemo, useState } from "react";
import { NewChatPage } from "./pages/NewChatPage";
import { ChatPage } from "./pages/ChatPage";
import { ChatSessionProvider } from "./hooks/chatSession";
import { useLayoutChrome } from "./hooks/layoutChrome";
import { ModelNameProvider } from "./hooks/modelName";
import { TaskStateProvider } from "./hooks/taskState";
import { VerboseProvider } from "./hooks/verbose";

import { useChat } from "@ai-sdk/react";
import { DirectChatTransport } from "ai";

import { agent, type AgentUIMessage } from "../agent";

import pkg from "../../package.json" with { type: "json" };

const transport = new DirectChatTransport({ agent });

function shortenCwd(cwd: string): string {
  const home = process.env.HOME ?? "";
  if (home && cwd.startsWith(home)) {
    if (cwd === home) return "~";
    return `~${cwd.slice(home.length)}`;
  }
  return cwd;
}

function sessionTitleFrom(messages: AgentUIMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "Chat";
  const raw = first.parts.find((p) => p.type === "text")?.text.trim();
  if (!raw) return "Chat";
  const t = raw.slice(0, 40);
  return t.length < raw.length ? `${t}…` : t;
}

function AppShell() {
  const { width: termWidth } = useTerminalDimensions();
  const [inputValue, setInputValue] = useState("");
  const { showSidebar, showFooter } = useLayoutChrome();

  const { messages, sendMessage, status } = useChat<AgentUIMessage>({
    transport,
  });

  const cwdDisplay = shortenCwd(process.cwd());
  const version = pkg.version ?? "0.0.0";
  const appLabel = `${pkg.name} ${version}`;

  const sessionTitle = useMemo(
    () => sessionTitleFrom(messages),
    [messages],
  );

  const handleSubmit = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;

      if (status === "ready" || status === "error") {
        setInputValue("");
        sendMessage({ text });
      }

    },
    [sendMessage, status],
  );

  useKeyboard((key) => {
    if (key.name === "escape") setInputValue("");
  });

  return (
    <>
      {messages.length === 0 ? (
        <box flexGrow={1} backgroundColor="#000000" height="100%">
          <NewChatPage
            termWidth={termWidth}
            cwdDisplay={cwdDisplay}
            version={version}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSubmit={handleSubmit}
            showFooter={showFooter}
          />
        </box>
      ) : (
        <box flexGrow={1} backgroundColor="#000000" height="100%" minHeight={0}>
          <ChatSessionProvider status={status}>
            <TaskStateProvider messages={messages}>
              <ChatPage
                messages={messages}
                sessionTitle={sessionTitle}
                cwdDisplay={cwdDisplay}
                appLabel={appLabel}
                version={version}
                inputValue={inputValue}
                onInputChange={setInputValue}
                onSubmit={handleSubmit}
                showSidebar={showSidebar}
                showFooter={showFooter}
                status={status}
              />
            </TaskStateProvider>
          </ChatSessionProvider>
        </box>
      )}
    </>
  );
}

export function App() {
  return (
    <ModelNameProvider>
      <VerboseProvider>
        <AppShell />
      </VerboseProvider>
    </ModelNameProvider>
  );
}

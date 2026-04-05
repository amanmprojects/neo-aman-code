import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useCallback, useMemo, useState } from "react";
import { NewChatPage } from "./pages/NewChatPage";
import { ChatPage } from "./pages/ChatPage";
import { ChatSessionProvider } from "./hooks/chatSession";
import { ModelNameProvider } from "./hooks/modelName";

import { useChat } from '@ai-sdk/react';
import { agent } from '../agent/agent';

import pkg from "../../package.json" with { type: "json" };
import { DirectChatTransport, type UIMessage } from "ai";

function shortenCwd(cwd: string): string {
  const home = process.env.HOME ?? "";
  if (home && cwd.startsWith(home)) {
    if (cwd === home) return "~";
    return `~${cwd.slice(home.length)}`;
  }
  return cwd;
}

function sessionTitleFrom(messages: UIMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "Chat";
  const raw = first.parts.find((p) => p.type === "text")?.text.trim();
  if (!raw) return "Chat";
  const t = raw.slice(0, 40);
  return t.length < raw.length ? `${t}…` : t;
}

function mockReply(userText: string, userTurnIndex: number): string {
  if (userTurnIndex === 0) return "Hey! What can I help you with today?";
  const clipped =
    userText.length > 80 ? `${userText.slice(0, 80)}…` : userText;
  return `I heard: "${clipped}" — mock reply.`;
}

export function App() {
  const { width: termWidth } = useTerminalDimensions();
  const [inputValue, setInputValue] = useState("");
  const [toggleSidebar, setToggleSidebar] = useState(true);

  const transport = useMemo(() => new DirectChatTransport({ agent }), []);
  const { messages, sendMessage, status } = useChat({
    transport,
  });

  const cwdDisplay = shortenCwd(process.cwd());
  const version = pkg.version ?? "0.0.0";
  const appLabel = `${pkg.name} ${version}`;

  const sessionTitle = useMemo(
    () => sessionTitleFrom(messages),
    [messages],
  );

  const handleSubmit = useCallback((raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setInputValue("");
    sendMessage({ text: text})
  }, []);

  useKeyboard((key) => {
    if (key.name === "escape") setInputValue("");
    if (key.ctrl && key.name === "s") setToggleSidebar((prev) => !prev);
  });

  return (
    <ModelNameProvider>
      {messages.length === 0 ? (
        <box flexGrow={1} backgroundColor="#000000" height="100%">
          <NewChatPage
            termWidth={termWidth}
            cwdDisplay={cwdDisplay}
            version={version}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSubmit={handleSubmit}
          />
        </box>
      ) : (
        <box flexGrow={1} backgroundColor="#000000" height="100%" minHeight={0}>
          <ChatSessionProvider status={status}>
            <ChatPage
              messages={messages}
              sessionTitle={sessionTitle}
              cwdDisplay={cwdDisplay}
              appLabel={appLabel}
              version={version}
              inputValue={inputValue}
              onInputChange={setInputValue}
              onSubmit={handleSubmit}
              showSidebar={toggleSidebar}
            />
          </ChatSessionProvider>
        </box>
      )}
    </ModelNameProvider>
  );
}

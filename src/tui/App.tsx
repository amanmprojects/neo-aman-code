import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useCallback, useMemo, useState } from "react";
import { NewChatPage } from "./pages/NewChatPage";
import { ChatPage } from "./pages/ChatPage";
import type { ChatMessage } from "./types";

import pkg from "../../package.json" with { type: "json" };

function shortenCwd(cwd: string): string {
  const home = process.env.HOME ?? "";
  if (home && cwd.startsWith(home)) {
    if (cwd === home) return "~";
    return `~${cwd.slice(home.length)}`;
  }
  return cwd;
}

function sessionTitleFrom(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "Chat";
  const raw = first.content.trim();
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");

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
    setMessages((prev) => {
      const userTurnIndex = prev.filter((m) => m.role === "user").length;
      const nextUser: ChatMessage = { role: "user", content: text };
      const nextAssistant: ChatMessage = {
        role: "assistant",
        content: mockReply(text, userTurnIndex),
      };
      return [...prev, nextUser, nextAssistant];
    });
  }, []);

  useKeyboard((key) => {
    if (key.name === "escape") setInputValue("");
  });

  if (messages.length === 0) {
    return (
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
    );
  }

  return (
    <box flexGrow={1} backgroundColor="#000000" height="100%" minHeight={0}>
      <ChatPage
        messages={messages}
        sessionTitle={sessionTitle}
        cwdDisplay={cwdDisplay}
        appLabel={appLabel}
        version={version}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSubmit={handleSubmit}
      />
    </box>
  );
}

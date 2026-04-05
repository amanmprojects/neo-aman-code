import { createContext, useContext, type ReactNode } from "react";
import type { ChatStatus } from "ai";

const ChatSessionContext = createContext<ChatStatus>("ready");

/** Supplies `useChat()` status to descendants (e.g. markdown streaming) without prop drilling. */
export function ChatSessionProvider({
  status,
  children,
}: {
  status: ChatStatus;
  children: ReactNode;
}) {
  return (
    <ChatSessionContext.Provider value={status}>{children}</ChatSessionContext.Provider>
  );
}

export function useChatSessionStatus(): ChatStatus {
  return useContext(ChatSessionContext);
}

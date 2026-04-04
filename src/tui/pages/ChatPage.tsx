import type { ChatMessage } from "../types";
import { theme } from "../theme";
import { AppFooter } from "../components/AppFooter";
import { Omnibar } from "../components/Omnibar";
import { Sidebar } from "../components/Sidebar";
import { UserMessage } from "../components/UserMessage";
const INPUT_PLACEHOLDER = "Message…";

type ChatPageProps = {
  messages: ChatMessage[];
  sessionTitle: string;
  cwdDisplay: string;
  appLabel: string;
  /** Required by AppFooter props; chat footer does not display it */
  version: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (value: string) => void;
};

export function ChatPage({
  messages,
  sessionTitle,
  cwdDisplay,
  appLabel,
  version,
  inputValue,
  onInputChange,
  onSubmit,
}: ChatPageProps) {

  return (
    <box flexDirection="row" flexGrow={1} backgroundColor={theme.bg} minHeight={0}>
      <box
        flexDirection="column"
        flexGrow={1}
        minWidth={0}
        minHeight={0}
        flexShrink={1}
        paddingX={2}
      >

        <scrollbox
          flexGrow={1}
          minHeight={0}
          
          stickyScroll
          stickyStart="bottom"
          rootOptions={{ backgroundColor: theme.bg }}
          paddingRight={2}
        >
          <box flexDirection="column" paddingX={0} paddingY={1} gap={1}>
            {messages.map((m, i) => (
              m.role === 'user' ? <UserMessage key={i} message={m.content} /> : <text key={i} fg={theme.text} selectable>{m.content}</text>
            ))}
            <box>
              <text fg={theme.text}>
                <span fg={theme.accent}>▣</span>
                {" Build · gpt-5.3-codex"}
              </text>
            </box>
          </box>
        </scrollbox>

        <box paddingX={0} paddingY={1} flexShrink={0} flexDirection="column" gap={0}>
          <Omnibar
            width="100%"
            value={inputValue}
            onChange={onInputChange}
            onSubmit={onSubmit}
            placeholder={INPUT_PLACEHOLDER}
            focused
          />
          <box marginTop={0}>
            <AppFooter
              variant="chat"
              cwdDisplay={cwdDisplay}
              version={version}
            />
          </box>
        </box>
      </box>

      <Sidebar
        sessionTitle={sessionTitle}
        cwdDisplay={cwdDisplay}
        appLabel={appLabel}
      />
    </box>
  );
}

import { theme } from "../theme";
import { AppFooter } from "../components/AppFooter";
import { Omnibar } from "../components/Omnibar";
import { Sidebar } from "../components/Sidebar";
import type { AgentUIMessage } from "../../agent";
import { ScrollableMessageList } from "../components/ScrollableMessageList";
const INPUT_PLACEHOLDER = "Message…";

type ChatPageProps = {
  messages: AgentUIMessage[];
  sessionTitle: string;
  cwdDisplay: string;
  appLabel: string;
  /** Required by AppFooter props; chat footer does not display it */
  version: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (value: string) => void;
  showSidebar: boolean;
  showFooter: boolean;
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
  showSidebar,
  showFooter,
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

        <ScrollableMessageList messages={messages} />

        <box paddingX={0} paddingY={1} flexShrink={0} flexDirection="column" gap={0}>
          <Omnibar
            width="100%"
            value={inputValue}
            onChange={onInputChange}
            onSubmit={onSubmit}
            placeholder={INPUT_PLACEHOLDER}
            focused
          />
          {showFooter && <AppFooter variant="chat" cwdDisplay={cwdDisplay} version={version} />}
        </box>
      </box>

      {showSidebar && <Sidebar
        sessionTitle={sessionTitle}
        cwdDisplay={cwdDisplay}
        appLabel={appLabel}
      />}
    </box>
  );
}

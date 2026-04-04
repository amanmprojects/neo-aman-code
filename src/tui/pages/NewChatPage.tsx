import { theme } from "../theme";
import { AppFooter } from "../components/AppFooter";
import { ComposerShortcuts } from "../components/ComposerShortcuts";
import { Omnibar } from "../components/Omnibar";

const INPUT_PLACEHOLDER =
  'Ask anything... "Fix a TODO in the codebase"';

const TIP_BODY =
  'Configure \'git push\': "ask" to require approval before pushing';

type NewChatPageProps = {
  termWidth: number;
  cwdDisplay: string;
  version: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (value: string) => void;
};

export function NewChatPage({
  termWidth,
  cwdDisplay,
  version,
  inputValue,
  onInputChange,
  onSubmit,
}: NewChatPageProps) {
  const omnibarWidth = Math.max(36, Math.floor(termWidth * 0.4));

  return (
    <box
      flexDirection="column"
      flexGrow={1}
      backgroundColor={theme.bg}
      height="100%"
    >
      <box flexGrow={1} minHeight={0} />
      <box flexDirection="column" alignItems="center" gap={1}>
        <ascii-font font="tiny" text="NEO-AMAN-CODE" color="#c8c8c8" />
        <Omnibar
          width={omnibarWidth}
          value={inputValue}
          onChange={onInputChange}
          onSubmit={onSubmit}
          placeholder={INPUT_PLACEHOLDER}
          focused
        />
        <ComposerShortcuts width={omnibarWidth} />
        <box marginTop={2}>
          <text>
            <span fg={theme.orange}>● Tip</span>
            <span fg={theme.dim}> {TIP_BODY}</span>
          </text>
        </box>
      </box>
      <box flexGrow={1} minHeight={0} />
      <box paddingY={1}>
        <AppFooter variant="splash" cwdDisplay={cwdDisplay} version={version} />
      </box>
    </box>
  );
}

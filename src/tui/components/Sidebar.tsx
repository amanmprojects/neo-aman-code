import { TextAttributes } from "@opentui/core";
import { theme } from "../theme";

type SidebarProps = {
  sessionTitle: string;
  cwdDisplay: string;
  appLabel: string;
};

export function Sidebar({
  sessionTitle,
  cwdDisplay,
  appLabel,
}: SidebarProps) {
  return (
    <box
      width={40}
      flexShrink={0}
      flexDirection="column"
      backgroundColor={theme.sidebarBg}
      border={["left"]}
      borderColor={theme.borderSubtle}
      paddingX={2}
      paddingY={1}
      gap={1}
    >
      <text fg={theme.text}>
        <strong>{sessionTitle}</strong>
      </text>

      <text fg={theme.muted}>
        <strong>Context</strong>
      </text>
      <text attributes={TextAttributes.DIM} fg={theme.dim}>
        0 tokens
        <br />
        0% used
        <br />$0.00 spent
      </text>

      <text fg={theme.muted}>
        <strong>LSP</strong>
      </text>
      <text attributes={TextAttributes.DIM} fg={theme.dim}>
        • typescript
        <br />
        <span fg={theme.green}>•</span> eslint
      </text>

      <box flexGrow={1} minHeight={1} />

      <text attributes={TextAttributes.DIM} fg={theme.dim}>
        {cwdDisplay}
      </text>
      <text attributes={TextAttributes.DIM} fg={theme.dim}>
        <span fg={theme.green}>•</span> {appLabel}
      </text>
    </box>
  );
}

import { TextAttributes } from "@opentui/core";
import { theme } from "../theme";

export type AppFooterVariant = "splash" | "chat";

type AppFooterProps = {
  variant: AppFooterVariant;
  cwdDisplay: string;
  version: string;
};

export function AppFooter({ variant, cwdDisplay, version }: AppFooterProps) {
  if (variant === "splash") {
    return (
      <box
        flexShrink={0}
        paddingX={1}
        paddingY={0}
        flexDirection="row"
        justifyContent="space-between"
        width="100%"
      >
        <text attributes={TextAttributes.DIM} fg={theme.dim}>
          {cwdDisplay}
        </text>
        <text attributes={TextAttributes.DIM} fg={theme.dim}>
          {version}
        </text>
      </box>
    );
  }

  return (
    <box
      flexShrink={0}
      paddingX={1}
      paddingY={0}
      flexDirection="row"
      justifyContent="space-between"
      width="100%"
    >
      <text attributes={TextAttributes.DIM} fg={theme.dim}>
        esc interrupt
      </text>
      <text attributes={TextAttributes.DIM} fg={theme.dim}>
        tab agents  ctrl+p commands
      </text>
    </box>
  );
}

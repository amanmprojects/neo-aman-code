import type { InputProps } from "@opentui/react";
import { theme } from "../theme";

type OmnibarProps = {
  width: number | "100%";
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder: string;
  focused?: boolean;
};

export function Omnibar({
  width,
  value,
  onChange,
  onSubmit,
  placeholder,
  focused = true,
}: OmnibarProps) {
  return (
    <box flexDirection="row" width={width} alignItems="stretch" paddingTop={1}>
      <box
        width={1}
        flexShrink={0}
        backgroundColor={theme.accent}
      />
      <box
        flexGrow={1}
        flexShrink={1}
        backgroundColor={theme.panel}
        paddingX={2}
        paddingY={1}
        flexDirection="column"
        gap={1}
      >
        <input
          value={value}
          onInput={onChange}
          onSubmit={onSubmit as NonNullable<InputProps["onSubmit"]>}
          placeholder={placeholder}
          focused={focused}
          backgroundColor={theme.panel}
          textColor={theme.text}
          placeholderColor={theme.muted}
          cursorColor={theme.cursor}
        />
        <text fg={theme.dim}>
          <span fg={theme.accent}>Build</span>
          {"  "}
          <span fg={theme.text}>GPT-5.3-Codex GitHub Copilot</span>
          {" · "}
          <span fg={theme.orange}>xhigh</span>
        </text>
      </box>
    </box>
  );
}

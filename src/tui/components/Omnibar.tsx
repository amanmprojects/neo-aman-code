import type { InputProps } from "@opentui/react";
import { theme } from "../theme";
import { useModelName } from "../hooks/modelName";

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
  const modelName = useModelName();

  return (
    <box flexDirection="row" width={width} alignItems="stretch"
      border={['left']}
      borderColor={theme.accent}
      focusedBorderColor={'red'}
      borderStyle="heavy"
    >
      <box
        flexGrow={1}
        flexShrink={1}
        paddingX={2}
        flexDirection="column"
        gap={1}
        border={['top', 'bottom']}
        borderColor={theme.panel}
        borderStyle="single"
        backgroundColor={theme.panel}
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
          <span fg={theme.text}>{modelName}</span>
          {" · "}
          <span fg={theme.orange}>xhigh</span>
        </text>
      </box>
    </box>
  );
}

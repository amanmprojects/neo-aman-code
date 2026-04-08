import type { InputProps } from "@opentui/react";
import { useMemo } from "react";
import { theme } from "../theme";
import { useModelName } from "../hooks/modelName";
import { createColors, createFrames } from "./spinner/knightRider";
import "opentui-spinner/react";

type OmnibarProps = {
  width: number | "100%";
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  status: "ready" | "streaming" | "submitted" | "error";
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
  status = "ready",
}: OmnibarProps) {
  const modelName = useModelName();

  const knightRiderSpinner = useMemo(
    () => ({
      frames: createFrames({
        color: theme.accent,
        style: "blocks",
        inactiveFactor: 0.6,
        minAlpha: 0.3,
      }),
      color: createColors({
        color: theme.accent,
        style: "blocks",
        inactiveFactor: 0.6,
        minAlpha: 0.3,
      }),
    }),
    [theme.accent],
  );

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
        <box flexDirection="row" alignItems="center" gap={1}>
          <text fg={theme.dim} flexShrink={1}>
            <span fg={theme.accent}>Build</span>
            {"  "}
            <span fg={theme.text}>{modelName}</span>
            {" · "}
            <span fg={theme.orange}>xhigh</span>
          </text>
          {(status !== "ready" && status !== "error") ? (
            <spinner
              color={knightRiderSpinner.color}
              frames={knightRiderSpinner.frames}
              interval={40}
              autoplay
            />
          ) : null}
        </box>
      </box>
    </box>
  );
}

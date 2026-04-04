import { TextAttributes } from "@opentui/core";
import { theme } from "../theme";

type ComposerShortcutsProps = {
  width: number;
};

export function ComposerShortcuts({ width }: ComposerShortcutsProps) {
  return (
    <box width={width} flexDirection="row" justifyContent="flex-end">
      <text attributes={TextAttributes.DIM} fg={theme.dim}>
        tab agents  ctrl+p commands
      </text>
    </box>
  );
}

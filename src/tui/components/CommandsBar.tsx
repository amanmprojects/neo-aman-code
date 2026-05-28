import type { ScrollAcceleration } from "@opentui/core";
import { theme } from "../theme";
import { commands } from "../commands/";

/** Visible rows in the command palette; additional commands scroll. */
const VISIBLE_COMMAND_LINES = 5;

const commandListScrollAcceleration: ScrollAcceleration = {
  tick() {
    return 3;
  },
  reset() { },
};

function Command({ command }: { command: typeof commands[number] }) {
  return (
    <box key={command.name} flexShrink={1} flexDirection="row">
      <box width={"30%"}><text fg={theme.dim}>{"/" + command.name}</text></box>
      <box width={"70%"}><text fg={theme.dim}>{command.description}</text></box>
    </box>
  );
}

export function CommandBar() {
  return (
    <box
      flexDirection="column"
      width="100%"
      alignItems="stretch"
      border={["left"]}
      borderColor={theme.panel}
      borderStyle="heavy"
      backgroundColor={theme.panel}
      paddingLeft={1}
    >
      <scrollbox
        height={Math.min(VISIBLE_COMMAND_LINES, commands.length)}
        width="100%"
        flexShrink={0}
        scrollY
        scrollAcceleration={commandListScrollAcceleration}
        rootOptions={{ backgroundColor: theme.panel }}
        viewportOptions={{ backgroundColor: theme.panel }}
        contentOptions={{ backgroundColor: theme.panel, paddingY: 0 }}
      >
        <box flexDirection="column" width="100%" minWidth={0} gap={0}>
          {commands.map((command) => <Command key={command.name} command={command} />)}
        </box>
      </scrollbox>
    </box>
  );
}

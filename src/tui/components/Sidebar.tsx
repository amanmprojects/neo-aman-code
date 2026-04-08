import { TextAttributes } from "@opentui/core";
import type { TaskStatus } from "../../agent/tools/task/taskListState";
import { useTaskState } from "../hooks/taskState";
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
  const { tasks, openCount, completedCount, blockedCount } = useTaskState();

  function assertNever(value: never): never {
    throw new Error(`Unhandled task status: ${value}`);
  }

  function statusColor(status: TaskStatus) {
    switch (status) {
      case "pending":
        return theme.orange;
      case "completed":
        return theme.green;
      case "in_progress":
        return theme.accent;
    }

    return assertNever(status);
  }

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

      <text fg={theme.muted}>
        <strong>Tasks</strong>
      </text>
      <text attributes={TextAttributes.DIM} fg={theme.dim}>
        {openCount} open
        <br />
        {blockedCount} blocked
        <br />
        {completedCount} completed
      </text>

      <scrollbox
        flexGrow={1}
        minHeight={0}
        scrollY
        rootOptions={{ backgroundColor: theme.sidebarBg }}
        viewportOptions={{ backgroundColor: theme.sidebarBg }}
        contentOptions={{ backgroundColor: theme.sidebarBg }}
      >
        <box flexDirection="column" gap={1} minWidth={0} width="100%">
          {tasks.length === 0 ? (
            <text attributes={TextAttributes.DIM} fg={theme.dim}>
              No tasks yet
            </text>
          ) : (
            tasks.map((task) => (
              <box key={task.id} flexDirection="column" minWidth={0}>
                <text fg={statusColor(task.status)}>
                  <strong>#{task.id}</strong>
                  {` ${task.status}`}
                </text>
                <text fg={theme.text}>{task.subject}</text>
                {task.owner ? (
                  <text attributes={TextAttributes.DIM} fg={theme.dim}>
                    owner={task.owner}
                  </text>
                ) : null}
                {task.blockedBy.length > 0 ? (
                  <text attributes={TextAttributes.DIM} fg={theme.orange}>
                    blocked by {task.blockedBy.map(id => `#${id}`).join(", ")}
                  </text>
                ) : null}
              </box>
            ))
          )}
        </box>
      </scrollbox>

      <text attributes={TextAttributes.DIM} fg={theme.dim}>
        {cwdDisplay}
      </text>
      <text attributes={TextAttributes.DIM} fg={theme.dim}>
        <span fg={theme.green}>•</span> {appLabel}
      </text>
    </box>
  );
}

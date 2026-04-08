import {createContext, useContext, useMemo, type ReactNode} from "react";
import type {AgentUIMessage} from "../../agent";
import type {TaskStatus} from "../../agent/tools/task/taskListState";
import type {TaskCreateToolInvocation} from "../../agent/tools/task/create";
import type {TaskGetToolInvocation} from "../../agent/tools/task/get";
import type {TaskListToolInvocation} from "../../agent/tools/task/list";
import type {TaskUpdateToolInvocation} from "../../agent/tools/task/update";

type SidebarTask = {
  id: string;
  subject: string;
  status: TaskStatus;
  owner?: string;
  blockedBy: string[];
};

type TaskSidebarState = {
  tasks: SidebarTask[];
  openCount: number;
  completedCount: number;
  blockedCount: number;
};

const DEFAULT_TASK_STATE: TaskSidebarState = {
  tasks: [],
  openCount: 0,
  completedCount: 0,
  blockedCount: 0,
};

const TaskStateContext = createContext<TaskSidebarState>(DEFAULT_TASK_STATE);

function createPlaceholderTask(id: string): SidebarTask {
  return {
    id,
    subject: `Task #${id}`,
    status: "pending",
    blockedBy: [],
  };
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

function deriveTaskState(messages: AgentUIMessage[]): TaskSidebarState {
  const tasks = new Map<string, SidebarTask>();
  const order = new Set<string>();

  function touchTask(
    id: string,
    update?: Partial<SidebarTask>,
    appendToOrder: boolean = true,
  ): SidebarTask {
    const existing = tasks.get(id) ?? createPlaceholderTask(id);
    const next: SidebarTask = {
      ...existing,
      ...update,
      blockedBy: update?.blockedBy ? dedupe(update.blockedBy) : existing.blockedBy,
    };
    tasks.set(id, next);

    if (appendToOrder && !order.has(id)) {
      order.add(id);
    }

    return next;
  }

  function removeTask(id: string) {
    tasks.delete(id);
    order.delete(id);
    for (const task of tasks.values()) {
      task.blockedBy = task.blockedBy.filter(blockerId => blockerId !== id);
    }
  }

  for (const message of messages) {
    for (const part of message.parts) {
      switch (part.type) {
        case "tool-taskCreate": {
          const invocation = part as TaskCreateToolInvocation;
          if (invocation.state !== "output-available") {
            break;
          }

          const task = invocation.output.task;
          if (!task) {
            break;
          }

          touchTask(task.id, {
            id: task.id,
            subject: task.subject,
            status: "pending",
          });
          break;
        }
        case "tool-taskGet": {
          const invocation = part as TaskGetToolInvocation;
          if (invocation.state !== "output-available" || !invocation.output.task) {
            break;
          }

          const task = invocation.output.task;
          touchTask(task.id, {
            id: task.id,
            subject: task.subject,
            status: task.status,
            owner: task.owner,
            blockedBy: task.blockedBy,
          });
          break;
        }
        case "tool-taskList": {
          const invocation = part as TaskListToolInvocation;
          if (invocation.state !== "output-available") {
            break;
          }

          const nextOrder = invocation.output.tasks.map(task => task.id);
          const nextMap = new Map<string, SidebarTask>();
          for (const summary of invocation.output.tasks) {
            const existing = tasks.get(summary.id);
            nextMap.set(summary.id, {
              id: summary.id,
              subject: summary.subject,
              status: summary.status,
              owner: summary.owner ?? existing?.owner,
              blockedBy: dedupe(summary.blockedBy),
            });
          }

          tasks.clear();
          for (const [id, task] of nextMap) {
            tasks.set(id, task);
          }
          order.clear();
          nextOrder.forEach(id => order.add(id));
          break;
        }
        case "tool-taskUpdate": {
          const invocation = part as TaskUpdateToolInvocation;
          if (invocation.state !== "output-available") {
            break;
          }

          const output = invocation.output;
          if (!output.success) {
            break;
          }

          const input = invocation.input;
          if (input.status === "deleted") {
            removeTask(output.taskId);
            break;
          }

          const current = touchTask(output.taskId);
          const nextStatus = output.statusChange?.to ?? input.status ?? current.status;

          touchTask(output.taskId, {
            subject: input.subject ?? current.subject,
            status: nextStatus,
            owner: input.owner ?? current.owner,
            blockedBy: dedupe([
              ...current.blockedBy,
              ...(input.addBlockedBy ?? []),
            ]),
          });

          for (const blockedTaskId of input.addBlocks ?? []) {
            const blockedTask = tasks.get(blockedTaskId);
            if (!blockedTask) {
              continue;
            }

            touchTask(blockedTaskId, {
              blockedBy: dedupe([...blockedTask.blockedBy, output.taskId]),
            }, false);
          }
          break;
        }
        default:
          break;
      }
    }
  }

  const orderedTasks = Array.from(order)
    .map(id => tasks.get(id))
    .filter((task): task is SidebarTask => task !== undefined);

  const completedCount = orderedTasks.filter(task => task.status === "completed").length;
  const openTasks = orderedTasks.filter(task => task.status !== "completed");
  const blockedCount = openTasks.filter(task => task.blockedBy.length > 0).length;

  return {
    tasks: orderedTasks,
    openCount: openTasks.length,
    completedCount,
    blockedCount,
  };
}

export function TaskStateProvider({
  messages,
  children,
}: {
  messages: AgentUIMessage[];
  children: ReactNode;
}) {
  const value = useMemo(() => deriveTaskState(messages), [messages]);

  return (
    <TaskStateContext.Provider value={value}>{children}</TaskStateContext.Provider>
  );
}

export function useTaskState(): TaskSidebarState {
  return useContext(TaskStateContext);
}

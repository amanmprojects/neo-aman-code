import type { TaskCreateToolInvocation } from "../../../agent/tools/task/create";
import type { TaskGetToolInvocation } from "../../../agent/tools/task/get";
import type { TaskListToolInvocation } from "../../../agent/tools/task/list";
import type { TaskUpdateToolInvocation } from "../../../agent/tools/task/update";
import { theme } from "../../theme";
import { AssistantToolFrame } from "../MessageFrames";

function renderFrame(content: string, bordered: boolean = true) {
    return (
        <AssistantToolFrame border={bordered ? ["left"] : false}>
            <text fg={theme.muted}>{content}</text>
        </AssistantToolFrame>
    );
}

function formatTask(task: {
    id: string;
    subject: string;
    status?: string;
    blockedBy?: string[];
    owner?: string;
}) {
    const parts = [`#${task.id}`, task.subject];
    if (task.status) {
        parts.push(task.status);
    }
    if (task.owner) {
        parts.push(`owner=${task.owner}`);
    }
    if (task.blockedBy && task.blockedBy.length > 0) {
        parts.push(`blockedBy=${task.blockedBy.join(",")}`);
    }
    return parts.join(" — ");
}

export function TaskCreateToolBlock({ invocation }: { invocation: TaskCreateToolInvocation }) {
    switch (invocation.state) {
        case "input-streaming":
            return renderFrame("taskCreate — reading arguments…", false);
        case "input-available":
            return renderFrame(`taskCreate — ${invocation.input.subject ?? "(subject)"}`);
        case "output-available":
            if (!invocation.output.task) {
                return renderFrame("taskCreate — no task returned");
            }
            return renderFrame(
                `taskCreate — created #${invocation.output.task.id} — ${invocation.output.task.subject}`,
            );
        case "output-error":
            return renderFrame(`taskCreate — error: ${invocation.errorText}`);
        case "approval-requested":
            return renderFrame("taskCreate — approval requested (not configured in this client)", false);
        case "approval-responded":
            return renderFrame("taskCreate — approval responded", false);
        default:
            return renderFrame("taskCreate — unknown state", false);
    }
}

export function TaskGetToolBlock({ invocation }: { invocation: TaskGetToolInvocation }) {
    switch (invocation.state) {
        case "input-streaming":
            return renderFrame("taskGet — reading arguments…", false);
        case "input-available":
            return renderFrame(`taskGet — ${invocation.input.taskId ?? "(task id)"}`);
        case "output-available":
            if (!invocation.output.task) {
                return renderFrame("taskGet — task not found");
            }
            return renderFrame(`taskGet — ${formatTask(invocation.output.task)}`);
        case "output-error":
            return renderFrame(`taskGet — error: ${invocation.errorText}`);
        case "approval-requested":
            return renderFrame("taskGet — approval requested (not configured in this client)", false);
        case "approval-responded":
            return renderFrame("taskGet — approval responded", false);
        default:
            return renderFrame("taskGet — unknown state", false);
    }
}

export function TaskListToolBlock({ invocation }: { invocation: TaskListToolInvocation }) {
    switch (invocation.state) {
        case "input-streaming":
            return renderFrame("taskList — reading arguments…", false);
        case "input-available":
            return renderFrame("taskList");
        case "output-available": {
            const tasks = invocation.output.tasks;
            if (tasks.length === 0) {
                return renderFrame("taskList — no tasks");
            }
            return renderFrame(
                ["taskList", ...tasks.map(task => formatTask(task))].join("\n"),
            );
        }
        case "output-error":
            return renderFrame(`taskList — error: ${invocation.errorText}`);
        case "approval-requested":
            return renderFrame("taskList — approval requested (not configured in this client)", false);
        case "approval-responded":
            return renderFrame("taskList — approval responded", false);
        default:
            return renderFrame("taskList — unknown state", false);
    }
}

export function TaskUpdateToolBlock({ invocation }: { invocation: TaskUpdateToolInvocation }) {
    switch (invocation.state) {
        case "input-streaming":
            return renderFrame("taskUpdate — reading arguments…", false);
        case "input-available":
            return renderFrame(`taskUpdate — ${invocation.input.taskId ?? "(task id)"}`);
        case "output-available":
            if (invocation.output.error) {
                return renderFrame(`taskUpdate — error: ${invocation.output.error}`);
            }
            return renderFrame(
                `taskUpdate — #${invocation.output.taskId} — ${invocation.output.updatedFields.join(", ") || "no changes"}`,
            );
        case "output-error":
            return renderFrame(`taskUpdate — error: ${invocation.errorText}`);
        case "approval-requested":
            return renderFrame("taskUpdate — approval requested (not configured in this client)", false);
        case "approval-responded":
            return renderFrame("taskUpdate — approval responded", false);
        default:
            return renderFrame("taskUpdate — unknown state", false);
    }
}

import {tool, type UIToolInvocation} from 'ai';
import {z} from 'zod';
import {getTaskSessionId, listTaskRecords, TASK_STATUSES} from '../taskListState';
import {getTaskListDescription} from './prompt';

const taskSummarySchema = z.object({
	id: z.string(),
	subject: z.string(),
	status: z.enum(TASK_STATUSES),
	owner: z.string().optional(),
	blockedBy: z.array(z.string()),
});

export const taskList = tool({
	description: getTaskListDescription(),
	inputSchema: z.object({}),
	outputSchema: z.object({
		tasks: z.array(taskSummarySchema),
	}),
	async execute(_input, toolOptions) {
		const sessionId = getTaskSessionId(toolOptions);
		const tasks = listTaskRecords(sessionId);
		const completedTaskIds = new Set(
			tasks.filter(task => task.status === 'completed').map(task => task.id),
		);
		const taskSummaries = tasks.map(task =>
			taskSummarySchema.parse({
				id: task.id,
				subject: task.subject,
				status: task.status,
				owner: task.owner,
				blockedBy: task.blockedBy.filter(id => !completedTaskIds.has(id)),
			}),
		);
		return {
			tasks: taskSummaries,
		};
	},
});

export type TaskListToolInvocation = UIToolInvocation<typeof taskList>;

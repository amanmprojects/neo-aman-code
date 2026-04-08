import {tool} from 'ai';
import {z} from 'zod';
import {getTaskSessionId, listTaskRecords} from '../taskListState';
import {getTaskListDescription} from './prompt';

const isTaskStatus = (
	value: string,
): value is 'pending' | 'in_progress' | 'completed' =>
	value === 'pending' || value === 'in_progress' || value === 'completed';

const taskSummarySchema = z.object({
	id: z.string(),
	subject: z.string(),
	status: z.string().refine(isTaskStatus, 'Invalid task status'),
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

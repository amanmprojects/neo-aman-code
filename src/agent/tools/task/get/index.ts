import {tool, type UIToolInvocation} from 'ai';
import {z} from 'zod';
import {
	getTaskSessionId,
	listTaskRecords,
	TASK_STATUSES,
	getTaskRecord,
} from '../taskListState';
import {getTaskGetDescription} from './prompt';

const taskOutputSchema = z.object({
	id: z.string(),
	subject: z.string(),
	description: z.string(),
	status: z.enum(TASK_STATUSES),
	blocks: z.array(z.string()),
	blockedBy: z.array(z.string()),
	owner: z.string().optional(),
});

export const taskGet = tool({
	description: getTaskGetDescription(),
	inputSchema: z.object({
		taskId: z.string().describe('The ID of the task to retrieve.'),
	}),
	outputSchema: z.object({
		task: taskOutputSchema.nullable(),
	}),
	async execute({taskId}, toolOptions) {
		const sessionId = getTaskSessionId(toolOptions);
		const taskRecord = getTaskRecord(sessionId, taskId);
		if (!taskRecord) {
			return {task: null};
		}
		const completedTaskIds = new Set(
			listTaskRecords(sessionId)
				.filter(task => task.status === 'completed')
				.map(task => task.id),
		);

		const task = taskOutputSchema.parse({
			id: taskRecord.id,
			subject: taskRecord.subject,
			description: taskRecord.description,
			status: taskRecord.status,
			blocks: taskRecord.blocks,
			blockedBy: taskRecord.blockedBy.filter(id => !completedTaskIds.has(id)),
			owner: taskRecord.owner,
		});

		return {
			task,
		};
	},
});

export type TaskGetToolInvocation = UIToolInvocation<typeof taskGet>;

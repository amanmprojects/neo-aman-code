import {tool} from 'ai';
import {z} from 'zod';
import {getTaskRecord, getTaskSessionId} from '../taskListState';
import {getTaskGetDescription} from './prompt';

const isTaskStatus = (
	value: string,
): value is 'pending' | 'in_progress' | 'completed' =>
	value === 'pending' || value === 'in_progress' || value === 'completed';

const taskOutputSchema = z.object({
	id: z.string(),
	subject: z.string(),
	description: z.string(),
	status: z.string().refine(isTaskStatus, 'Invalid task status'),
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

		const task = taskOutputSchema.parse({
			id: taskRecord.id,
			subject: taskRecord.subject,
			description: taskRecord.description,
			status: taskRecord.status,
			blocks: taskRecord.blocks,
			blockedBy: taskRecord.blockedBy,
			owner: taskRecord.owner,
		});

		return {
			task,
		};
	},
});

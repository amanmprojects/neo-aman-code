import {tool} from 'ai';
import {z} from 'zod';
import {createTaskRecord, getTaskSessionId} from '../taskListState';
import {getTaskCreateDescription} from './prompt';

export const taskCreate = tool({
	description: getTaskCreateDescription(),
	inputSchema: z.object({
		subject: z.string().describe('A brief title for the task.'),
		description: z.string().describe('What needs to be done.'),
		activeForm: z
			.string()
			.optional()
			.describe('Present continuous text for in-progress UI states.'),
		metadata: z
			.record(z.string(), z.unknown())
			.optional()
			.describe('Optional metadata to attach to the task.'),
	}),
	outputSchema: z.object({
		task: z.object({
			id: z.string(),
			subject: z.string(),
		}),
	}),
	async execute({subject, description, activeForm, metadata}, toolOptions) {
		const sessionId = getTaskSessionId(toolOptions);
		const task = createTaskRecord(sessionId, {
			subject,
			description,
			activeForm,
			metadata,
		});
		return {
			task: {
				id: task.id,
				subject: task.subject,
			},
		};
	},
});

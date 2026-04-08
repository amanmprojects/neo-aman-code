import {tool} from 'ai';
import {z} from 'zod';
import {
	deleteTaskRecord,
	getTaskSessionId,
	updateTaskRecord,
} from '../taskListState';
import {getTaskUpdateDescription} from './prompt';

const isTaskStatus = (
	value: string,
): value is 'pending' | 'in_progress' | 'completed' =>
	value === 'pending' || value === 'in_progress' || value === 'completed';

const isTaskUpdateStatus = (
	value: string,
): value is 'pending' | 'in_progress' | 'completed' | 'deleted' =>
	isTaskStatus(value) || value === 'deleted';

export const taskUpdate = tool({
	description: getTaskUpdateDescription(),
	inputSchema: z.object({
		taskId: z.string().describe('The ID of the task to update.'),
		subject: z.string().optional().describe('New subject for the task.'),
		description: z
			.string()
			.optional()
			.describe('New description for the task.'),
		activeForm: z
			.string()
			.optional()
			.describe('Present continuous text for in-progress UI states.'),
		status: z
			.string()
			.refine(isTaskUpdateStatus, 'Invalid task status')
			.optional()
			.describe('New status for the task.'),
		addBlocks: z
			.array(z.string())
			.optional()
			.describe('Task IDs this task blocks.'),
		addBlockedBy: z
			.array(z.string())
			.optional()
			.describe('Task IDs that block this task.'),
		owner: z.string().optional().describe('New owner for the task.'),
		metadata: z
			.record(z.string(), z.unknown().nullable())
			.optional()
			.describe(
				'Metadata keys to merge into the task. Set a key to null to delete it.',
			),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		taskId: z.string(),
		updatedFields: z.array(z.string()),
		error: z.string().optional(),
		statusChange: z
			.object({
				from: z.string().refine(isTaskStatus, 'Invalid task status'),
				to: z.string().refine(isTaskStatus, 'Invalid task status'),
			})
			.optional(),
	}),
	async execute(input, toolOptions) {
		const sessionId = getTaskSessionId(toolOptions);
		if (input.status === 'deleted') {
			const deleted = deleteTaskRecord(sessionId, input.taskId);
			return {
				success: deleted,
				taskId: input.taskId,
				updatedFields: deleted ? ['deleted'] : [],
				error: deleted ? undefined : 'Task not found',
			};
		}

		const deleteMetadataKeys = Object.entries(input.metadata ?? {})
			.filter(([, value]) => value === null)
			.map(([key]) => key);
		const metadata = Object.fromEntries(
			Object.entries(input.metadata ?? {}).filter(
				([, value]) => value !== null,
			),
		);

		const result = updateTaskRecord(sessionId, input.taskId, {
			subject: input.subject,
			description: input.description,
			activeForm: input.activeForm,
			status: input.status,
			owner: input.owner,
			metadata,
			deleteMetadataKeys,
			addBlocks: input.addBlocks,
			addBlockedBy: input.addBlockedBy,
		});
		return {
			success: result.success,
			taskId: input.taskId,
			updatedFields: result.updatedFields,
			error: result.error,
			statusChange: result.statusChange,
		};
	},
});

import type {ToolExecutionOptions} from 'ai';

export const TASK_STATUSES = ['pending', 'in_progress', 'completed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const TASK_UPDATE_STATUSES = [...TASK_STATUSES, 'deleted'] as const;
export type TaskUpdateStatus = (typeof TASK_UPDATE_STATUSES)[number];
export type TaskPriority = 'high' | 'medium' | 'low';
export type TodoItem = {
	id: string;
	content: string;
	status: TaskStatus;
	priority: TaskPriority;
};
export type TaskRecord = {
	id: string;
	subject: string;
	description: string;
	status: TaskStatus;
	activeForm?: string;
	owner?: string;
	blocks: string[];
	blockedBy: string[];
	metadata?: Record<string, unknown>;
	priority?: TaskPriority;
};

type TaskListStore = {
	tasks: Map<string, TaskRecord>;
	order: string[];
	nextId: number;
	expiresAt: number;
};

type TaskUpdateInput = {
	subject?: string;
	description?: string;
	activeForm?: string;
	status?: TaskStatus;
	owner?: string;
	metadata?: Record<string, unknown>;
	deleteMetadataKeys?: string[];
	addBlocks?: string[];
	addBlockedBy?: string[];
};

const TASK_LIST_TTL_MS = 30 * 60 * 1000;
const TASK_LIST_SWEEP_INTERVAL_MS = 5 * 60 * 1000;

const taskLists = new Map<string, TaskListStore>();
let taskListCleanupTimer: ReturnType<typeof setInterval> | undefined;

function cloneTask(task: TaskRecord): TaskRecord {
	return {
		...task,
		blocks: [...task.blocks],
		blockedBy: [...task.blockedBy],
		metadata: task.metadata ? {...task.metadata} : undefined,
	};
}

function touchTaskList(store: TaskListStore): void {
	store.expiresAt = Date.now() + TASK_LIST_TTL_MS;
}

function stopTaskListCleanupIfIdle(): void {
	if (taskLists.size > 0 || taskListCleanupTimer === undefined) {
		return;
	}

	clearInterval(taskListCleanupTimer);
	taskListCleanupTimer = undefined;
}

function sweepExpiredTaskLists(now: number = Date.now()): void {
	for (const [sessionId, store] of taskLists) {
		if (store.expiresAt <= now) {
			taskLists.delete(sessionId);
		}
	}

	stopTaskListCleanupIfIdle();
}

function scheduleTaskListCleanup(): void {
	if (taskListCleanupTimer !== undefined) {
		return;
	}

	taskListCleanupTimer = setInterval(() => {
		sweepExpiredTaskLists();
	}, TASK_LIST_SWEEP_INTERVAL_MS);
	taskListCleanupTimer.unref?.();
}

function getTaskList(sessionId: string): TaskListStore | undefined {
	sweepExpiredTaskLists();
	const existing = taskLists.get(sessionId);
	if (existing) {
		touchTaskList(existing);
		return existing;
	}

	return undefined;
}

function getOrCreateTaskList(sessionId: string): TaskListStore {
	const existing = getTaskList(sessionId);
	if (existing) {
		return existing;
	}

	const created: TaskListStore = {
		tasks: new Map<string, TaskRecord>(),
		order: [],
		nextId: 1,
		expiresAt: 0,
	};
	touchTaskList(created);

	taskLists.set(sessionId, created);
	scheduleTaskListCleanup();
	return created;
}

function dedupe(values: string[]): string[] {
	return [...new Set(values.filter(Boolean))];
}

function getNextId(tasks: Iterable<{id: string}>): number {
	let maxId = 0;
	for (const task of tasks) {
		const parsed = Number.parseInt(task.id, 10);
		if (Number.isFinite(parsed)) {
			maxId = Math.max(maxId, parsed);
		}
	}

	return maxId + 1;
}

export function getTaskSessionId(toolOptions?: ToolExecutionOptions): string {
	const context = toolOptions?.experimental_context as
		| {sessionId?: string}
		| undefined;
	return context?.sessionId ?? 'default';
}

export function removeTaskList(sessionId: string): boolean {
	const removed = taskLists.delete(sessionId);
	stopTaskListCleanupIfIdle();
	return removed;
}

export function createTaskRecord(
	sessionId: string,
	input: {
		subject: string;
		description: string;
		activeForm?: string;
		owner?: string;
		metadata?: Record<string, unknown>;
		priority?: TaskPriority;
	},
): TaskRecord {
	const store = getOrCreateTaskList(sessionId);
	const task: TaskRecord = {
		id: String(store.nextId++),
		subject: input.subject,
		description: input.description,
		status: 'pending',
		activeForm: input.activeForm,
		owner: input.owner,
		blocks: [],
		blockedBy: [],
		metadata: input.metadata ? {...input.metadata} : undefined,
		priority: input.priority,
	};
	store.tasks.set(task.id, task);
	store.order.push(task.id);
	return cloneTask(task);
}

export function getTaskRecord(
	sessionId: string,
	taskId: string,
): TaskRecord | undefined {
	const task = getTaskList(sessionId)?.tasks.get(taskId);
	return task ? cloneTask(task) : undefined;
}

export function listTaskRecords(sessionId: string): TaskRecord[] {
	const store = getTaskList(sessionId);
	if (!store) {
		return [];
	}

	return store.order
		.map(id => store.tasks.get(id))
		.filter((task): task is TaskRecord => task !== undefined)
		.map(task => cloneTask(task));
}

export function deleteTaskRecord(sessionId: string, taskId: string): boolean {
	const store = getTaskList(sessionId);
	if (!store) {
		return false;
	}

	if (!store.tasks.has(taskId)) {
		return false;
	}

	store.tasks.delete(taskId);
	store.order = store.order.filter(id => id !== taskId);

	for (const task of store.tasks.values()) {
		task.blocks = task.blocks.filter(id => id !== taskId);
		task.blockedBy = task.blockedBy.filter(id => id !== taskId);
	}

	return true;
}

export function updateTaskRecord(
	sessionId: string,
	taskId: string,
	updates: TaskUpdateInput,
): {
	success: boolean;
	task?: TaskRecord;
	updatedFields: string[];
	statusChange?: {from: TaskStatus; to: TaskStatus};
	error?: string;
} {
	const store = getTaskList(sessionId);
	if (!store) {
		return {
			success: false,
			updatedFields: [],
			error: 'Task not found',
		};
	}

	const existing = store.tasks.get(taskId);
	if (!existing) {
		return {
			success: false,
			updatedFields: [],
			error: 'Task not found',
		};
	}

	const updatedFields: string[] = [];
	let statusChange:
		| {
				from: TaskStatus;
				to: TaskStatus;
		  }
		| undefined;

	if (updates.subject !== undefined && updates.subject !== existing.subject) {
		existing.subject = updates.subject;
		updatedFields.push('subject');
	}

	if (
		updates.description !== undefined &&
		updates.description !== existing.description
	) {
		existing.description = updates.description;
		updatedFields.push('description');
	}

	if (
		updates.activeForm !== undefined &&
		updates.activeForm !== existing.activeForm
	) {
		existing.activeForm = updates.activeForm;
		updatedFields.push('activeForm');
	}

	if (updates.owner !== undefined && updates.owner !== existing.owner) {
		existing.owner = updates.owner;
		updatedFields.push('owner');
	}

	if (
		updates.metadata !== undefined ||
		(updates.deleteMetadataKeys !== undefined &&
			updates.deleteMetadataKeys.length > 0)
	) {
		const deleteMetadataKeys = new Set(updates.deleteMetadataKeys ?? []);
		const nextMetadata = Object.fromEntries(
			Object.entries({
				...(existing.metadata === undefined ? {} : existing.metadata),
				...(updates.metadata === undefined ? {} : updates.metadata),
			}).filter(([key]) => !deleteMetadataKeys.has(key)),
		) as Record<string, unknown>;

		existing.metadata =
			Object.keys(nextMetadata).length > 0 ? nextMetadata : undefined;
		updatedFields.push('metadata');
	}

	if (updates.status !== undefined && updates.status !== existing.status) {
		statusChange = {from: existing.status, to: updates.status};
		existing.status = updates.status;
		updatedFields.push('status');
	}

	if (updates.addBlocks && updates.addBlocks.length > 0) {
		const additions = updates.addBlocks.filter(
			id => id !== taskId && store.tasks.has(id),
		);
		if (additions.length > 0) {
			existing.blocks = dedupe([...existing.blocks, ...additions]);
			for (const blockedTaskId of additions) {
				const blockedTask = store.tasks.get(blockedTaskId);
				if (blockedTask) {
					blockedTask.blockedBy = dedupe([...blockedTask.blockedBy, taskId]);
				}
			}

			updatedFields.push('blocks');
		}
	}

	if (updates.addBlockedBy && updates.addBlockedBy.length > 0) {
		const additions = updates.addBlockedBy.filter(
			id => id !== taskId && store.tasks.has(id),
		);
		if (additions.length > 0) {
			existing.blockedBy = dedupe([...existing.blockedBy, ...additions]);
			for (const blockerId of additions) {
				const blockerTask = store.tasks.get(blockerId);
				if (blockerTask) {
					blockerTask.blocks = dedupe([...blockerTask.blocks, taskId]);
				}
			}

			updatedFields.push('blockedBy');
		}
	}

	return {
		success: true,
		task: cloneTask(existing),
		updatedFields,
		statusChange,
	};
}

export function replaceTasksFromTodos(
	sessionId: string,
	todos: TodoItem[],
): TodoItem[] {
	const store = getOrCreateTaskList(sessionId);
	const nextTodos = todos.every(todo => todo.status === 'completed')
		? []
		: todos;
	store.tasks = new Map(
		nextTodos.map(todo => [
			todo.id,
			{
				id: todo.id,
				subject: todo.content,
				description: todo.content,
				status: todo.status,
				blocks: [],
				blockedBy: [],
				priority: todo.priority,
			},
		]),
	);
	store.order = nextTodos.map(todo => todo.id);
	store.nextId = getNextId(nextTodos);
	return listTodos(sessionId);
}

export function listTodos(sessionId: string): TodoItem[] {
	return listTaskRecords(sessionId).map(task => ({
		id: task.id,
		content: task.subject,
		status: task.status,
		priority: task.priority ?? 'medium',
	}));
}

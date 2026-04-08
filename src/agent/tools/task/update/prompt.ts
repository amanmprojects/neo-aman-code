export const taskUpdateToolName = 'taskUpdate';

export function getTaskUpdateDescription(): string {
	return `Use this tool to update a task in the task list.

## When to Use This Tool

- When starting work on a task - Set status to 'in_progress' BEFORE beginning work
- When completing a task - Set status to 'completed' after finishing the work
- When updating task details - Modify subject, description, or activeForm
- When managing dependencies - Add or remove blockedBy relationships
- When removing a task - Set status to 'deleted' to remove it from active tracking
- After creating a task - Update with dependencies if needed

## Status Values

- **pending**: Task is waiting to be started (default)
- **in_progress**: Currently being worked on
- **completed**: Work is finished
- **deleted**: Task is removed from tracking

## Tips

- Always mark a task as 'in_progress' BEFORE starting work on it
- Mark tasks as 'completed' only after fully finishing the work
- Use blockedBy to prevent starting tasks whose dependencies aren't ready
- Use TaskGet first to understand current state before making updates`;
}

export const taskCreateToolName = 'taskCreate';

export function getTaskCreateDescription(): string {
	return `Create a task in the structured task list.

Usage:
- Use this tool to create a new tracked work item
- Provide a short subject and a fuller description
- New tasks start with status 'pending'
- Use taskUpdate to mark progress or completion later`;
}

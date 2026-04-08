export const taskUpdateToolName = 'taskUpdate';

export function getTaskUpdateDescription(): string {
	return `Update a task in the structured task list.

Usage:
- Change subject, description, active form, owner, or status
- Add dependency relationships with addBlocks or addBlockedBy
- Use status 'completed' when work is done
- Use status 'deleted' to remove a task`;
}

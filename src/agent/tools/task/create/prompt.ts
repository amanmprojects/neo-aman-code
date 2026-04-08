export const taskCreateToolName = 'taskCreate';

export function getTaskCreateDescription(): string {
	return `Use this tool to create a structured task list for your current coding session. This helps you track progress, organize complex tasks, and demonstrate thoroughness to the user.

## When to Use This Tool

Use this tool proactively in these scenarios:

- Complex multi-step tasks - When a task requires 3 or more distinct steps or actions
- Non-trivial and complex tasks - Tasks that require careful planning or multiple operations
- Plan mode - When using plan mode, create a task list to track the work
- User explicitly requests todo list - When the user directly asks you to use the todo list
- User provides multiple tasks - When users provide a list of things to be done (numbered or comma-separated)
- After receiving new instructions - Immediately capture user requirements as tasks
- When you discover new follow-up work that should be tracked as its own task
- After completing a task - Create any newly discovered follow-up tasks here

## When NOT to Use This Tool

Skip using this tool when:
- There is only a single, straightforward task
- The task is trivial and tracking it provides no organizational benefit
- The task can be completed in less than 3 trivial steps
- The task is purely conversational or informational

## Task Fields

- **subject**: A brief, actionable title in imperative form (e.g., "Fix authentication bug in login flow")
- **description**: What needs to be done
- **activeForm** (optional): Present continuous form shown in the spinner when the task later becomes in_progress (e.g., "Fixing authentication bug"). If omitted, the spinner shows the subject instead.

Every taskCreate call creates a new task with status 'pending'.

## Tips

- Create tasks with clear, specific subjects that describe the outcome
- Use taskUpdate, not this tool, to mark existing tasks as 'in_progress' or 'completed'
- After creating tasks, use taskUpdate to set up blockedBy dependencies if needed
- Check taskList first to avoid creating duplicate tasks`;
}

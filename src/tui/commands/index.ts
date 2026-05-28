export const commands = [
  {
    name: "help",
    description: "Show help information for available commands and their descriptions",
  },
  {
    name: "exit",
    description: "Exit the application",
  },
  {
    name: "task create",
    description: "Create a new task",
  },
  {
    name: "task list",
    description: "List all tasks",
  },
  {
    name: "task get",
    description: "Get a task by ID",
  },
  {
    name: "task update",
    description: "Update a task by ID",
  },
  {
    name: "task delete",
    description: "Delete a task by ID",
  },
] as const;
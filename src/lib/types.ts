export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignedTo: string[];
  configuration: {
    priority: string;
    tags?: string[];
    customFields?: Record<string, string>;
  };
  dependencies: string[];
};

export type Project = {
  id: string;
  name: string;
  description: string;
  metadata?: Record<string, string>;
  tasks: Task[];
};

export type Comment = {
  id: string;
  taskId: string;
  content: string;
  author: string;
  timestamp: string;
};

export type ProjectEvent = {
  id: string;
  projectId: string;
  type: "task_update" | "comment_add" | "other";
  message: string;
  timestamp: string;
  // For Undo/Redo
  data?: {
    taskId?: string;
    field?: string;
    previousValue?: any;
    newValue?: any;
  };
  reverted?: boolean;
};

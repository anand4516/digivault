export interface Todo {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in_progress" | "done";
  dueDate: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-cv-teal/20 text-cv-teal" },
  medium: { label: "Medium", color: "bg-cv-amber/20 text-cv-amber" },
  high: { label: "High", color: "bg-cv-coral/20 text-cv-coral" },
  urgent: { label: "Urgent", color: "bg-destructive/20 text-destructive" },
};

export const STATUS_CONFIG = {
  todo: { label: "To Do", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", color: "bg-primary/20 text-primary" },
  done: { label: "Done", color: "bg-cv-teal/20 text-cv-teal" },
};

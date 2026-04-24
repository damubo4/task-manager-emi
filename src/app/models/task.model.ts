export interface StateHistory {
  state: string;
  date: string;
}

export interface Task {
  id?: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  stateHistory: StateHistory[];
  notes: string[];
}

export interface TaskState {
  id: string;
  name: string;
}

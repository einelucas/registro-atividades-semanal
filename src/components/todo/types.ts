export type TodoList = {
  id: string;
  name: string;
  color: string;
  position: number;
};
export type TodoTask = {
  id: string;
  listId: string | null;
  title: string;
  note: string;
  important: boolean;
  myDay: string | null;
  dueDate: string | null;
  reminderAt: string | null;
  repeatRule: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  completedAt: string | null;
  activityId: string | null;
  createdAt: string;
};
export type TodoStep = {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  position: number;
};
export type TodoPreferences = {
  unitId: string | null;
  categoryId: string | null;
  autoRegister: boolean;
};
export type TodoState = {
  lists: TodoList[];
  tasks: TodoTask[];
  steps: TodoStep[];
  preferences: TodoPreferences;
};
export type TodoView = 'day' | 'important' | 'planned' | 'all' | 'completed' | 'list:' | 'search';
export type TodoSection = 'day' | 'important' | 'planned' | 'all' | 'completed' | 'search' | ('list:' & string);

export const todayISO = (): string => {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
};
export const niceDate = (date: string): string =>
  new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day:'numeric', month:'short' });
export const dateSentence = (): string =>
  new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' });

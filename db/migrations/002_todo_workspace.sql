-- Tarefas locais independentes; aplicar após db/schema.sql e 001_local_auth.sql.
CREATE TABLE IF NOT EXISTS todo_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 100),
  color varchar(7) NOT NULL DEFAULT '#607caa' CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS todo_lists_user_idx ON todo_lists(user_id, position, created_at);

CREATE TABLE IF NOT EXISTS todo_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  list_id uuid REFERENCES todo_lists(id) ON DELETE SET NULL,
  title varchar(300) NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 300),
  note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 10000),
  important boolean NOT NULL DEFAULT false,
  my_day date,
  due_date date,
  reminder_at timestamptz,
  repeat_rule varchar(10) NOT NULL DEFAULT 'NONE'
    CHECK (repeat_rule IN ('NONE','DAILY','WEEKLY','MONTHLY')),
  completed_at timestamptz,
  activity_id uuid UNIQUE REFERENCES activities(id) ON DELETE SET NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS todo_tasks_user_idx ON todo_tasks(user_id, completed_at, created_at DESC);
CREATE INDEX IF NOT EXISTS todo_tasks_user_due_idx ON todo_tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS todo_tasks_user_list_idx ON todo_tasks(user_id, list_id);

CREATE TABLE IF NOT EXISTS todo_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES todo_tasks(id) ON DELETE CASCADE,
  title varchar(250) NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 250),
  completed boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS todo_steps_task_idx ON todo_steps(task_id, position, created_at);

-- Seleção explícita da unidade e da categoria antes de registrar no histórico.
CREATE TABLE IF NOT EXISTS todo_preferences (
  user_id uuid PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES units(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  auto_register boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

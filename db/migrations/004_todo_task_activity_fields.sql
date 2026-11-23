BEGIN;

ALTER TABLE todo_tasks
  ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES units(id),
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id);

UPDATE todo_tasks AS task
SET unit_id = COALESCE(task.unit_id, activity.unit_id),
    category_id = COALESCE(task.category_id, activity.category_id)
FROM activities AS activity
WHERE task.activity_id = activity.id
  AND (task.unit_id IS NULL OR task.category_id IS NULL);

COMMIT;

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { PoolClient } from 'pg';
import { ApiError, identity, jsonError, pool } from '@/lib/server';

export const runtime = 'nodejs';

const uuid = z.uuid();
const date = z.iso.date();
const text = (max: number) => z.string().trim().min(1).max(max);
const optionalDate = date.nullable().optional();
const optionalUuid = uuid.nullable().optional();
const repeat = z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY']);
const listFields = z.object({
  name: text(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});
const taskFields = z.object({
  title: text(300),
  listId: optionalUuid,
  unitId: optionalUuid,
  categoryId: optionalUuid,
  myDay: optionalDate,
  dueDate: optionalDate,
  important: z.boolean().optional(),
  note: z.string().max(10000).optional(),
  repeatRule: repeat.optional(),
  reminderAt: z.iso.datetime({ offset: true }).nullable().optional(),
});
const taskPatch = taskFields.partial().extend({ completed: z.boolean().optional() });
const preferencesFields = z.object({
  autoRegister: z.boolean(),
});
const stepFields = z.object({ title: text(250) });

type ListRecord = { id: string; name: string; color: string };
type TaskRecord = { completed_at: string | null; activity_id: string | null; repeat_rule: string };

function fail(status: number, message: string): never { throw new ApiError(status, message); }
function valid<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) fail(400, 'Dados inválidos: verifique os campos informados.');
  return parsed.data;
}
function stringId(value: unknown) { return valid(uuid, value); }
async function ownsList(client: PoolClient, userId: string, listId: string | null | undefined) {
  if (!listId) return;
  const result = await client.query('SELECT id FROM todo_lists WHERE id=$1 AND user_id=$2', [listId, userId]);
  if (!result.rowCount) fail(400, 'A lista selecionada não pertence à sua conta.');
}
async function readTask(client: PoolClient, userId: string, id: string): Promise<TaskRecord> {
  const result = await client.query('SELECT completed_at::text, activity_id::text, repeat_rule FROM todo_tasks WHERE id=$1 AND user_id=$2 FOR UPDATE', [id, userId]);
  if (!result.rowCount) fail(404, 'Tarefa não encontrada.');
  return result.rows[0] as TaskRecord;
}
async function validateActivityFields(client: PoolClient, unitId?: string | null, categoryId?: string | null) {
  if (unitId && !(await client.query('SELECT id FROM units WHERE id=$1 AND active', [unitId])).rowCount) fail(400, 'Unidade inválida.');
  if (categoryId && !(await client.query('SELECT id FROM categories WHERE id=$1 AND active', [categoryId])).rowCount) fail(400, 'Categoria inválida.');
}
async function autoRegisterEnabled(client: PoolClient, userId: string): Promise<boolean> {
  const result = await client.query('SELECT auto_register FROM todo_preferences WHERE user_id=$1', [userId]);
  return result.rows[0]?.auto_register ?? true;
}
async function linkToActivity(client: PoolClient, userId: string, taskId: string) {
  const inserted = await client.query(
    `INSERT INTO activities(user_id,unit_id,category_id,description,status,activity_date)
     SELECT t.user_id,t.unit_id,t.category_id,t.title,'DONE',(t.completed_at AT TIME ZONE 'America/Campo_Grande')::date
     FROM todo_tasks t
     JOIN units u ON u.id=t.unit_id AND u.active
     JOIN categories c ON c.id=t.category_id AND c.active
     WHERE t.id=$1 AND t.user_id=$2 AND t.completed_at IS NOT NULL AND t.activity_id IS NULL
     RETURNING id::text`,
    [taskId, userId],
  );
  if (!inserted.rowCount) return false;
  await client.query('UPDATE todo_tasks SET activity_id=$1 WHERE id=$2 AND user_id=$3', [inserted.rows[0].id, taskId, userId]);
  return true;
}
async function backfill(client: PoolClient, userId: string) {
  const tasks = await client.query('SELECT id FROM todo_tasks WHERE user_id=$1 AND completed_at IS NOT NULL AND activity_id IS NULL AND unit_id IS NOT NULL AND category_id IS NOT NULL FOR UPDATE', [userId]);
  let count = 0;
  for (const task of tasks.rows) {
    if (await linkToActivity(client, userId, task.id)) count++;
  }
  return count;
}
async function inTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');
    const value = await fn(client);
    await client.query('COMMIT');
    return value;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
function parseBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'Corpo inválido.');
  return body as Record<string, unknown>;
}
function parseKind(body: Record<string, unknown>) {
  return valid(z.enum(['list','task','step','preferences']), body.kind);
}
function viewTasksQuery() {
  return 'SELECT t.id::text, t.list_id::text AS "listId", t.unit_id::text AS "unitId", t.category_id::text AS "categoryId", u.name AS "unitName", c.name AS "categoryName",t.title,t.note,t.important, to_char(t.my_day,\'YYYY-MM-DD\') AS "myDay",to_char(t.due_date,\'YYYY-MM-DD\') AS "dueDate",t.reminder_at::text AS "reminderAt",t.repeat_rule AS "repeatRule",t.completed_at::text AS "completedAt",t.activity_id::text AS "activityId",t.created_at::text AS "createdAt" FROM todo_tasks t LEFT JOIN units u ON u.id=t.unit_id LEFT JOIN categories c ON c.id=t.category_id WHERE t.user_id=$1 ORDER BY t.created_at DESC';
}
async function getState(userId: string) {
  const [lists, tasks, steps, prefs] = await Promise.all([
    pool().query('SELECT id::text,name,color,position FROM todo_lists WHERE user_id=$1 ORDER BY position,created_at', [userId]),
    pool().query(viewTasksQuery(), [userId]),
    pool().query('SELECT s.id::text,s.task_id::text AS "taskId",s.title,s.completed,s.position FROM todo_steps s JOIN todo_tasks t ON t.id=s.task_id WHERE t.user_id=$1 ORDER BY s.position,s.created_at', [userId]),
    pool().query('SELECT auto_register AS "autoRegister" FROM todo_preferences WHERE user_id=$1', [userId]),
  ]);
  return { lists: lists.rows, tasks: tasks.rows, steps: steps.rows, preferences: prefs.rows[0] || { autoRegister:true } };
}
export async function GET(req: NextRequest) {
  try {
    const user = await identity(req);
    return NextResponse.json(await getState(user.userId), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return jsonError(error); }
}
export async function POST(req: NextRequest) {
  try {
    const user = await identity(req);
    const body = parseBody(await req.json());
    const kind = parseKind(body);
    if (kind === 'list') {
      const value = valid(listFields, body);
      const res = await pool().query('INSERT INTO todo_lists(user_id,name,color,position) VALUES($1,$2,$3,(SELECT count(*) FROM todo_lists WHERE user_id=$1)) RETURNING id::text', [user.userId,value.name,value.color || '#607caa']);
      return NextResponse.json({ id:res.rows[0].id }, { status:201 });
    }
    if (kind === 'task') {
      const value = valid(taskFields, body);
      const id = await inTransaction(async client => {
        await ownsList(client, user.userId, value.listId);
        if ((!value.unitId || !value.categoryId) && await autoRegisterEnabled(client, user.userId)) {
          fail(400, 'Selecione a unidade e a categoria da tarefa.');
        }
        await validateActivityFields(client, value.unitId, value.categoryId);
        const res = await client.query(
          'INSERT INTO todo_tasks(user_id,list_id,title,note,important,my_day,due_date,reminder_at,repeat_rule,unit_id,category_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id::text',
          [user.userId,value.listId || null,value.title,value.note || '',value.important || false,value.myDay || null,value.dueDate || null,value.reminderAt || null,value.repeatRule || 'NONE',value.unitId ?? null,value.categoryId ?? null],
        );
        return res.rows[0].id as string;
      });
      return NextResponse.json({ id }, { status:201 });
    }
    if (kind === 'step') {
      const taskId = stringId(body.taskId);
      const value = valid(stepFields, body);
      const res = await pool().query(
        'INSERT INTO todo_steps(task_id,title,position) SELECT t.id,$3,(SELECT count(*) FROM todo_steps s WHERE s.task_id=t.id) FROM todo_tasks t WHERE t.id=$1 AND t.user_id=$2 RETURNING id::text',
        [taskId,user.userId,value.title],
      );
      if (!res.rowCount) fail(404, 'Tarefa não encontrada.');
      return NextResponse.json({ id:res.rows[0].id }, { status:201 });
    }
    fail(400, 'Tipo de criação não permitido.');
  } catch (error) { return jsonError(error); }
}
export async function PATCH(req: NextRequest) {
  try {
    const user = await identity(req);
    const body = parseBody(await req.json());
    const kind = parseKind(body);
    if (kind === 'preferences') {
      const change = valid(preferencesFields, body);
      const result = await inTransaction(async client => {
        // Serializa a alteração da preferência com o registro de tarefas da mesma conta.
        await client.query('SELECT id FROM app_users WHERE id=$1 FOR NO KEY UPDATE', [user.userId]);
        await client.query(
          'INSERT INTO todo_preferences(user_id,auto_register) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET auto_register=EXCLUDED.auto_register,updated_at=now()',
          [user.userId, change.autoRegister],
        );
        return change.autoRegister ? await backfill(client, user.userId) : 0;
      });
      return NextResponse.json({ ok:true, linked:result });
    }
    const id = stringId(body.id);
    if (kind === 'list') {
      const value = valid(listFields.partial(), body);
      if (!value.name && !value.color) fail(400, 'Nenhuma alteração fornecida.');
      const sets: string[] = []; const values: unknown[] = [];
      if (value.name !== undefined) { values.push(value.name); sets.push('name=$'+values.length); }
      if (value.color !== undefined) { values.push(value.color); sets.push('color=$'+values.length); }
      values.push(id,user.userId);
      const result = await pool().query('UPDATE todo_lists SET '+sets.join(',')+' WHERE id=$'+(values.length-1)+' AND user_id=$'+values.length+' RETURNING id',values);
      if (!result.rowCount) fail(404,'Lista não encontrada.');
      return NextResponse.json({ ok:true });
    }
    if (kind === 'step') {
      const value = valid(stepFields.partial().extend({ completed:z.boolean().optional() }),body);
      if (value.title === undefined && value.completed === undefined) fail(400,'Nenhuma alteração fornecida.');
      const sets: string[]=[];const values: unknown[]=[];
      if(value.title!==undefined){values.push(value.title);sets.push('title=$'+values.length);}
      if(value.completed!==undefined){values.push(value.completed);sets.push('completed=$'+values.length);}
      values.push(id,user.userId);
      const result=await pool().query('UPDATE todo_steps s SET '+sets.join(',')+' FROM todo_tasks t WHERE s.task_id=t.id AND s.id=$'+(values.length-1)+' AND t.user_id=$'+values.length+' RETURNING s.id',values);
      if(!result.rowCount)fail(404,'Etapa não encontrada.');
      return NextResponse.json({ok:true});
    }
    const patch = valid(taskPatch, body);
    const response = await inTransaction(async client => {
      await client.query('SELECT id FROM app_users WHERE id=$1 FOR NO KEY UPDATE', [user.userId]);
      const old = await readTask(client,user.userId,id);
      await ownsList(client,user.userId,patch.listId);
      if (old.activity_id && (patch.unitId === null || patch.categoryId === null)) {
        fail(400, 'Uma tarefa registrada precisa ter unidade e categoria.');
      }
      await validateActivityFields(client, patch.unitId, patch.categoryId);
      const activityFieldsChanged = patch.unitId !== undefined || patch.categoryId !== undefined;
      const columns: [string,unknown][]=[];
      const mapping: Record<string,string>={title:'title',note:'note',listId:'list_id',myDay:'my_day',dueDate:'due_date',important:'important',unitId:'unit_id',categoryId:'category_id',repeatRule:'repeat_rule',reminderAt:'reminder_at'};
      const fields = patch as Record<string,unknown>;
      for(const [field,column] of Object.entries(mapping)){
        if(fields[field] !== undefined) columns.push([column,fields[field]]);
      }
      if(columns.length){
        const values = columns.map(([,v])=>v);
        const sets=columns.map(([col],i)=>col+'=$'+(i+1));
        values.push(id,user.userId);
        await client.query('UPDATE todo_tasks SET '+sets.join(',')+',updated_at=now() WHERE id=$'+(values.length-1)+' AND user_id=$'+values.length,values);
      }
      let linked = !!old.activity_id;
      let pending = false;
      if (patch.completed === true && !old.completed_at) {
        await client.query('UPDATE todo_tasks SET completed_at=now(),updated_at=now() WHERE id=$1 AND user_id=$2',[id,user.userId]);
        if (await autoRegisterEnabled(client, user.userId)) {
          linked = await linkToActivity(client, user.userId, id);
          pending = !linked;
        }
        const rule = patch.repeatRule ?? old.repeat_rule;
        if (rule !== 'NONE') {
          const offset = rule === 'DAILY' ? '1 day' : rule === 'WEEKLY' ? '7 days' : '1 month';
          await client.query(
            `INSERT INTO todo_tasks(user_id,list_id,title,note,important,due_date,repeat_rule,unit_id,category_id)
             SELECT user_id,list_id,title,note,important,(due_date + $3::interval)::date,repeat_rule,unit_id,category_id
             FROM todo_tasks WHERE id=$1 AND user_id=$2`,
            [id, user.userId, offset],
          );
        }
      } else if (patch.completed === false && old.completed_at) {
        if(old.activity_id) await client.query('DELETE FROM activities WHERE id=$1 AND user_id=$2',[old.activity_id,user.userId]);
        await client.query('UPDATE todo_tasks SET completed_at=NULL,activity_id=NULL,updated_at=now() WHERE id=$1 AND user_id=$2',[id,user.userId]);
        linked=false;
      } else if (old.completed_at && old.activity_id && (activityFieldsChanged || patch.title)) {
        await client.query(
          'UPDATE activities SET description=COALESCE($1,description),unit_id=COALESCE($2,unit_id),category_id=COALESCE($3,category_id),updated_at=now() WHERE id=$4 AND user_id=$5',
          [patch.title ?? null, patch.unitId ?? null, patch.categoryId ?? null, old.activity_id, user.userId],
        );
      } else if (old.completed_at && !old.activity_id && activityFieldsChanged && await autoRegisterEnabled(client, user.userId)) {
        linked = await linkToActivity(client, user.userId, id);
      }
      return {ok:true,linked,pending,registered:linked && !old.activity_id};
    });
    return NextResponse.json(response);
  } catch(error) {return jsonError(error);}
}
export async function DELETE(req: NextRequest) {
  try {
    const user=await identity(req);
    const body=parseBody(await req.json());
    const kind=parseKind(body);
    if (kind === 'preferences') fail(400,'Operação não permitida.');
    const id=stringId(body.id);
    if (kind === 'list') {
      const result=await pool().query('DELETE FROM todo_lists WHERE id=$1 AND user_id=$2 RETURNING id',[id,user.userId]);
      if(!result.rowCount)fail(404,'Lista não encontrada.');
    } else if (kind === 'task') {
      const result=await pool().query('DELETE FROM todo_tasks WHERE id=$1 AND user_id=$2 RETURNING id',[id,user.userId]);
      if(!result.rowCount)fail(404,'Tarefa não encontrada.');
    } else {
      const result=await pool().query('DELETE FROM todo_steps s USING todo_tasks t WHERE s.id=$1 AND s.task_id=t.id AND t.user_id=$2 RETURNING s.id',[id,user.userId]);
      if(!result.rowCount)fail(404,'Etapa não encontrada.');
    }
    return NextResponse.json({ok:true});
  }catch(error){return jsonError(error);}
}

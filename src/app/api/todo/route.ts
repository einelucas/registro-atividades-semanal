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
  myDay: optionalDate,
  dueDate: optionalDate,
  important: z.boolean().optional(),
  note: z.string().max(10000).optional(),
  repeatRule: repeat.optional(),
  reminderAt: z.iso.datetime({ offset: true }).nullable().optional(),
});
const taskPatch = taskFields.partial().extend({ completed: z.boolean().optional() });
const preferencesFields = z.object({
  unitId: optionalUuid,
  categoryId: optionalUuid,
  autoRegister: z.boolean().optional(),
});
const stepFields = z.object({ title: text(250) });

type ListRecord = { id: string; name: string; color: string };
type TaskRecord = { id: string; title: string; completed_at: string | null; activity_id: string | null; repeat_rule: string; due_date: string | null; list_id: string | null; note: string; important: boolean };

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
  const result = await client.query('SELECT id::text, title, completed_at::text, activity_id::text, repeat_rule, due_date::text, list_id::text, note, important FROM todo_tasks WHERE id=$1 AND user_id=$2 FOR UPDATE', [id, userId]);
  if (!result.rowCount) fail(404, 'Tarefa não encontrada.');
  return result.rows[0] as TaskRecord;
}
async function linkToActivity(client: PoolClient, userId: string, taskId: string, title: string) {
  const pref = await client.query('SELECT unit_id::text,category_id::text,auto_register FROM todo_preferences WHERE user_id=$1', [userId]);
  const { unit_id, category_id, auto_register } = pref.rows[0] || {};
  if (!auto_register || !unit_id || !category_id) return false;
  const inserted = await client.query(
    "INSERT INTO activities(user_id,unit_id,category_id,description,status,activity_date) VALUES($1,$2,$3,$4,'DONE',(now() AT TIME ZONE 'America/Campo_Grande')::date) RETURNING id::text",
    [userId, unit_id, category_id, title],
  );
  await client.query('UPDATE todo_tasks SET activity_id=$1 WHERE id=$2 AND user_id=$3', [inserted.rows[0].id, taskId, userId]);
  return true;
}
async function backfill(client: PoolClient, userId: string) {
  const tasks = await client.query('SELECT id::text, title FROM todo_tasks WHERE user_id=$1 AND completed_at IS NOT NULL AND activity_id IS NULL ORDER BY completed_at DESC FOR UPDATE', [userId]);
  let count = 0;
  for (const task of tasks.rows) {
    if (await linkToActivity(client, userId, task.id, task.title)) count++;
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
  return 'SELECT t.id::text, t.list_id::text AS "listId",t.title,t.note,t.important, to_char(t.my_day,\'YYYY-MM-DD\') AS "myDay",to_char(t.due_date,\'YYYY-MM-DD\') AS "dueDate",t.reminder_at::text AS "reminderAt",t.repeat_rule AS "repeatRule",t.completed_at::text AS "completedAt",t.activity_id::text AS "activityId",t.created_at::text AS "createdAt" FROM todo_tasks t WHERE t.user_id=$1 ORDER BY t.created_at DESC';
}
async function getState(userId: string) {
  const [lists, tasks, steps, prefs] = await Promise.all([
    pool().query('SELECT id::text,name,color,position FROM todo_lists WHERE user_id=$1 ORDER BY position,created_at', [userId]),
    pool().query(viewTasksQuery(), [userId]),
    pool().query('SELECT s.id::text,s.task_id::text AS "taskId",s.title,s.completed,s.position FROM todo_steps s JOIN todo_tasks t ON t.id=s.task_id WHERE t.user_id=$1 ORDER BY s.position,s.created_at', [userId]),
    pool().query('SELECT unit_id::text AS "unitId",category_id::text AS "categoryId",auto_register AS "autoRegister" FROM todo_preferences WHERE user_id=$1', [userId]),
  ]);
  return { lists: lists.rows, tasks: tasks.rows, steps: steps.rows, preferences: prefs.rows[0] || { unitId:null, categoryId:null, autoRegister:true } };
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
        const res = await client.query(
          'INSERT INTO todo_tasks(user_id,list_id,title,note,important,my_day,due_date,reminder_at,repeat_rule) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id::text',
          [user.userId,value.listId || null,value.title,value.note || '',value.important || false,value.myDay || null,value.dueDate || null,value.reminderAt || null,value.repeatRule || 'NONE'],
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
        const existing = await client.query('SELECT unit_id::text AS "unitId",category_id::text AS "categoryId",auto_register AS "autoRegister" FROM todo_preferences WHERE user_id=$1 FOR UPDATE', [user.userId]);
        const prior = existing.rows[0] || { unitId:null, categoryId:null, autoRegister:true };
        const unitId = change.unitId === undefined ? prior.unitId : change.unitId;
        const categoryId = change.categoryId === undefined ? prior.categoryId : change.categoryId;
        const autoRegister = change.autoRegister === undefined ? prior.autoRegister : change.autoRegister;
        if (unitId && !(await client.query('SELECT id FROM units WHERE id=$1 AND active=true',[unitId])).rowCount) fail(400,'Unidade inválida.');
        if (categoryId && !(await client.query('SELECT id FROM categories WHERE id=$1 AND active=true',[categoryId])).rowCount) fail(400,'Categoria inválida.');
        await client.query('INSERT INTO todo_preferences(user_id,unit_id,category_id,auto_register) VALUES($1,$2,$3,$4) ON CONFLICT(user_id) DO UPDATE SET unit_id=EXCLUDED.unit_id,category_id=EXCLUDED.category_id,auto_register=EXCLUDED.auto_register,updated_at=now()', [user.userId,unitId,categoryId,autoRegister]);
        const linked = autoRegister && unitId && categoryId ? await backfill(client,user.userId) : 0;
        return linked;
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
      const old = await readTask(client,user.userId,id);
      await ownsList(client,user.userId,patch.listId);
      const columns: [string,unknown][]=[];
      const mapping: Record<string,string>={title:'title',note:'note',listId:'list_id',myDay:'my_day',dueDate:'due_date',important:'important',repeatRule:'repeat_rule',reminderAt:'reminder_at'};
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
        linked = await linkToActivity(client,user.userId,id,patch.title || old.title);
        pending = !linked;
        if(old.repeat_rule!=='NONE'){
          const rule=patch.repeatRule || old.repeat_rule;
          if(rule!=='NONE'){
            const offset=rule==='DAILY'?'1 day':rule==='WEEKLY'?'7 days':'1 month';
            await client.query(
              'INSERT INTO todo_tasks(user_id,list_id,title,note,important,due_date,repeat_rule) SELECT user_id,list_id,title,note,important,CASE WHEN due_date IS NULL THEN NULL ELSE (due_date + interval \''+offset+'\')::date END,repeat_rule FROM todo_tasks WHERE id=$1 AND user_id=$2',
              [id,user.userId],
            );
          }
        }
      } else if (patch.completed === false && old.completed_at) {
        if(old.activity_id) await client.query('DELETE FROM activities WHERE id=$1 AND user_id=$2',[old.activity_id,user.userId]);
        await client.query('UPDATE todo_tasks SET completed_at=NULL,activity_id=NULL,updated_at=now() WHERE id=$1 AND user_id=$2',[id,user.userId]);
        linked=false;
      } else if (old.completed_at && old.activity_id && patch.title && patch.title!==old.title) {
        await client.query('UPDATE activities SET description=$1,updated_at=now() WHERE id=$2 AND user_id=$3',[patch.title,old.activity_id,user.userId]);
      }
      return {ok:true,linked,pending};
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

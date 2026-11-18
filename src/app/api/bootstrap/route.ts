import { NextRequest,NextResponse } from 'next/server';
import { identity,pool,activitySQL,jsonError } from '@/lib/server';
export const runtime='nodejs';
export async function GET(req:NextRequest) {
  try {
    const user=await identity(req);
    const [people,units,categories,activities]=await Promise.all([
      pool().query('SELECT id::text,name,role FROM (SELECT id,display_name AS name,role FROM app_users WHERE active=true) users ORDER BY CASE WHEN role=$1 THEN 0 ELSE 1 END,name',['MANAGER']),
      pool().query('SELECT id::text,name FROM units WHERE active=true ORDER BY name'),
      pool().query('SELECT id::text,name FROM categories WHERE active=true ORDER BY name'),
      pool().query(`${activitySQL} ${user.demo || user.role==='MANAGER'?'':'WHERE a.user_id=$1'} ORDER BY a.activity_date DESC,a.created_at DESC LIMIT 2500`,user.demo || user.role==='MANAGER'?[]:[user.userId])
    ]);
    return NextResponse.json({people:user.demo?people.rows:people.rows.filter(p=>p.id===user.userId||user.role==='MANAGER'),units:units.rows,categories:categories.rows,activities:activities.rows,demo:user.demo},{headers:{'Cache-Control':'no-store'}});
  } catch(e) {return jsonError(e);}
}

import {NextRequest,NextResponse} from 'next/server';
import {identity,pool,activitySQL,jsonError} from '@/lib/server';
export const runtime='nodejs';
export async function GET(req:NextRequest){
 try{
 const user=await identity(req);
 const [people,units,categories,activities]=await Promise.all([
 pool().query("SELECT id::text,display_name AS name,role FROM app_users WHERE active=true AND password_hash IS NOT NULL AND ($1='MANAGER' OR id=$2) ORDER BY display_name",[user.role,user.userId]),
 pool().query('SELECT id::text,name FROM units WHERE active=true ORDER BY name'),
 pool().query('SELECT id::text,name FROM categories WHERE active=true ORDER BY name'),
 pool().query(`${activitySQL} WHERE EXISTS(SELECT 1 FROM app_users owner WHERE owner.id=a.user_id AND owner.password_hash IS NOT NULL) AND ($1='MANAGER' OR a.user_id=$2) ORDER BY a.activity_date DESC,a.created_at DESC LIMIT 2500`,[user.role,user.userId])
 ]);
 return NextResponse.json({people:people.rows,units:units.rows,categories:categories.rows,activities:activities.rows,demo:false,currentUserId:user.userId},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return jsonError(e);}
}
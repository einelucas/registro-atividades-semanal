import { NextRequest,NextResponse } from 'next/server';
import { identity,pool,actorId,assertDemoActor,ApiError,jsonError } from '@/lib/server';
export const runtime='nodejs';
import {activitySchema} from '@/lib/validation';
export async function POST(req:NextRequest){
  try {
    const user=await identity(req);
    const payload=activitySchema.safeParse(await req.json());
    if(!payload.success) throw new ApiError(400,'Campos inválidos ou incompletos');
    const p=payload.data;
    const id=actorId(user,p.personId||null);
    if(user.demo) await assertDemoActor(id);
    const result=await pool().query('INSERT INTO activities(user_id,unit_id,category_id,activity_date,description,status) VALUES($1,$2,$3,$4,$5,$6) RETURNING id::text',[id,p.unitId,p.categoryId,p.date,p.description,p.status]);
    return NextResponse.json({id:result.rows[0].id},{status:201});
  }catch(e){return jsonError(e);}
}

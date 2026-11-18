import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { identity,pool,actorId,assertDemoActor,ApiError,jsonError } from '@/lib/server';
import {activitySchema} from '@/lib/validation';
export const runtime='nodejs';
type Params={params:Promise<{id:string}>};
export async function PUT(req:NextRequest,{params}:Params){
  try {
    const {id}=await params;
    if(!z.uuid().safeParse(id).success) throw new ApiError(400,'ID inválido');
    const user=await identity(req), body=activitySchema.safeParse(await req.json());
    if(!body.success) throw new ApiError(400,'Campos inválidos');
    const p=body.data, actor=actorId(user,p.personId||null);
    if(user.demo) await assertDemoActor(actor);
    const r=await pool().query('UPDATE activities SET unit_id=$1,category_id=$2,activity_date=$3,description=$4,status=$5,updated_at=now() WHERE id=$6 AND user_id=$7 RETURNING id',[p.unitId,p.categoryId,p.date,p.description,p.status,id,actor]);
    if(!r.rowCount) throw new ApiError(404,'Atividade não encontrada para este usuário');
    return NextResponse.json({ok:true});
  }catch(e){return jsonError(e);}
}
export async function DELETE(req:NextRequest,{params}:Params){
  try {
    const {id}=await params;
    if(!z.uuid().safeParse(id).success) throw new ApiError(400,'ID inválido');
    const user=await identity(req);
    const actor=actorId(user,req.nextUrl.searchParams.get('personId'));
    if(user.demo) await assertDemoActor(actor);
    const r=await pool().query('DELETE FROM activities WHERE id=$1 AND user_id=$2 RETURNING id',[id,actor]);
    if(!r.rowCount) throw new ApiError(404,'Atividade não encontrada');
    return NextResponse.json({ok:true});
  }catch(e){return jsonError(e);}
}

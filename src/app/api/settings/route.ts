import { NextRequest,NextResponse } from 'next/server';
import {z} from 'zod';
import {identity,requireManager,actorId,assertDemoActor,pool,jsonError,ApiError} from '@/lib/server';
export const runtime='nodejs';
const payload=z.object({kind:z.enum(['units','categories']),name:z.string().trim().min(2).max(120),personId:z.string().uuid().optional()}).strict();
const table=(kind:'units'|'categories')=>kind;
async function authorize(req:NextRequest,actor:string|null){const u=await identity(req);requireManager(u,actor||undefined);if(u.demo){const p=await assertDemoActor(actorId(u,actor));if(p.role!=='MANAGER')throw new ApiError(403,'Apenas gestor pode alterar configurações');}}
export async function POST(req:NextRequest){try{const b=payload.safeParse(await req.json());if(!b.success)throw new ApiError(400,'Dados inválidos');await authorize(req,b.data.personId||null);const r=await pool().query(`INSERT INTO ${table(b.data.kind)}(name,active) VALUES($1,true) ON CONFLICT(name) DO UPDATE SET active=true RETURNING id::text,name`,[b.data.name]);return NextResponse.json(r.rows[0],{status:201});}catch(e){return jsonError(e);}}
export async function DELETE(req:NextRequest){try{const kind=req.nextUrl.searchParams.get('kind');const id=req.nextUrl.searchParams.get('id');if(kind!=='units'&&kind!=='categories')throw new ApiError(400,'Tipo inválido');if(!id||!z.uuid().safeParse(id).success)throw new ApiError(400,'ID inválido');await authorize(req,req.nextUrl.searchParams.get('personId'));const r=await pool().query(`UPDATE ${table(kind)} SET active=false WHERE id=$1 RETURNING id`,[id]);if(!r.rowCount)throw new ApiError(404,'Não encontrado');return NextResponse.json({ok:true});}catch(e){return jsonError(e);}}

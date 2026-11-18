import 'server-only';
import { Pool } from 'pg';
import { NextRequest, NextResponse } from 'next/server';

const url = process.env.DATABASE_URL;
const globalPool = globalThis as typeof globalThis & { __inpasaPool?: Pool };
export const pool = () => {
  if (!url) throw new Error('DATABASE_URL não configurada');
  if (!globalPool.__inpasaPool) globalPool.__inpasaPool = new Pool({ connectionString:url, max:5, idleTimeoutMillis:30000, connectionTimeoutMillis:12000 });
  return globalPool.__inpasaPool;
};
export class ApiError extends Error { constructor(public status:number, message:string){super(message);} }

export type Identity={demo:false;userId:string;role:'MANAGER'|'COLLABORATOR'};
export async function identity(_req:NextRequest):Promise<Identity>{
 const {sessionUser}=await import('./auth');
 const user=await sessionUser();
 if(!user)throw new ApiError(401,'Sessão expirada. Faça login novamente.');
 return {demo:false,userId:user.id,role:user.role};
}
export function requireManager(user:Identity,_actor?:string){
 if(user.role!=='MANAGER')throw new ApiError(403,'Acesso restrito à gestão');
}
export function actorId(user:Identity,_supplied:string|null){return user.userId;}
export async function assertDemoActor(_id:string){throw new ApiError(403,'Acesso de demonstração desativado');}
export function jsonError(error:unknown) {
  if(error instanceof ApiError) return NextResponse.json({error:error.message},{status:error.status});
  if(error instanceof Error && (error as {code?:string}).code === '23503') return NextResponse.json({error:'Registro em uso por outra entidade.'},{status:409});
  if(error instanceof Error && (error as {code?:string}).code === '23505') return NextResponse.json({error:'Este item já existe.'},{status:409});
  console.error('API failure:',error);
  return NextResponse.json({error:'Falha interna ao processar a solicitação'},{status:500});
}
export const activitySQL = `SELECT a.id::text, a.user_id::text AS "personId", u.display_name AS person, a.unit_id::text AS "unitId", un.name AS unit, a.category_id::text AS "categoryId", c.name AS category, a.description, a.status, to_char(a.activity_date,'YYYY-MM-DD') AS date, a.created_at::text AS "createdAt" FROM activities a JOIN app_users u ON u.id=a.user_id JOIN units un ON un.id=a.unit_id JOIN categories c ON c.id=a.category_id`;

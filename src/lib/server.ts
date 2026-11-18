import 'server-only';
import { Pool } from 'pg';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const url = process.env.DATABASE_URL;
const globalPool = globalThis as typeof globalThis & { __inpasaPool?: Pool };
export const pool = () => {
  if (!url) throw new Error('DATABASE_URL não configurada');
  if (!globalPool.__inpasaPool) globalPool.__inpasaPool = new Pool({ connectionString:url, max:5, idleTimeoutMillis:30000, connectionTimeoutMillis:12000 });
  return globalPool.__inpasaPool;
};
export class ApiError extends Error { constructor(public status:number, message:string){super(message);} }
export type Identity = { demo:boolean; userId?:string; role?:'MANAGER'|'COLLABORATOR'; oid?:string };
export async function identity(req:NextRequest):Promise<Identity> {
  const header = req.headers.get('authorization') || '';
  if (process.env.ENABLE_DEMO_AUTH === 'true' && !header) return { demo:true };
  if (!header.startsWith('Bearer ')) throw new ApiError(401, 'Autenticação corporativa obrigatória');
  const tenant = process.env.ENTRA_TENANT_ID;
  const audience = process.env.ENTRA_API_AUDIENCE;
  if (!tenant || !audience) throw new ApiError(503,'Autenticação Entra não configurada no servidor');
  const jwks = createRemoteJWKSet(new URL(`https://login.microsoftonline.com/${tenant}/discovery/v2.0/keys`));
  const {payload} = await jwtVerify(header.slice(7), jwks, {audience, issuer:`https://login.microsoftonline.com/${tenant}/v2.0`});
  if (typeof payload.oid !== 'string') throw new ApiError(403,'Token sem identificador corporativo');
  const result = await pool().query('SELECT id, role FROM app_users WHERE entra_oid=$1 AND active=true',[payload.oid]);
  if (!result.rows[0]) throw new ApiError(403,'Usuário não cadastrado ou inativo');
  return {demo:false,userId:result.rows[0].id,role:result.rows[0].role,oid:payload.oid};
}
export function requireManager(user:Identity, actor?:string) {
  if (user.demo) { if(!actor) throw new ApiError(400,'Informe o usuário da demonstração'); return; }
  if (user.role !== 'MANAGER') throw new ApiError(403,'Acesso restrito à gestão');
}
export function actorId(user:Identity, supplied:string|null) {
  if (!user.demo) return user.userId!;
  if (!supplied || !/^[0-9a-f-]{36}$/i.test(supplied)) throw new ApiError(400,'Usuário da demonstração inválido');
  return supplied;
}
export async function assertDemoActor(id:string) {
  const u=await pool().query('SELECT id,role FROM app_users WHERE id=$1 AND active=true',[id]);
  if(!u.rows[0]) throw new ApiError(403,'Usuário não encontrado');
  return u.rows[0] as {id:string;role:'MANAGER'|'COLLABORATOR'};
}
export function jsonError(error:unknown) {
  if(error instanceof ApiError) return NextResponse.json({error:error.message},{status:error.status});
  if(error instanceof Error && (error as {code?:string}).code === '23503') return NextResponse.json({error:'Registro em uso por outra entidade.'},{status:409});
  if(error instanceof Error && (error as {code?:string}).code === '23505') return NextResponse.json({error:'Este item já existe.'},{status:409});
  console.error('API failure:',error);
  return NextResponse.json({error:'Falha interna ao processar a solicitação'},{status:500});
}
export const activitySQL = `SELECT a.id::text, a.user_id::text AS "personId", u.display_name AS person, a.unit_id::text AS "unitId", un.name AS unit, a.category_id::text AS "categoryId", c.name AS category, a.description, a.status, to_char(a.activity_date,'YYYY-MM-DD') AS date, a.created_at::text AS "createdAt" FROM activities a JOIN app_users u ON u.id=a.user_id JOIN units un ON un.id=a.unit_id JOIN categories c ON c.id=a.category_id`;

import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {pool,ApiError,jsonError} from '@/lib/server';
import {normalizeEmail,checkPassword,createSession,checkOrigin} from '@/lib/auth';
export const runtime='nodejs';
const schema=z.object({email:z.email().max(250),password:z.string().min(1).max(128)}).strict();
export async function POST(req:NextRequest){
 try{
 await checkOrigin(req);
 const parsed=schema.safeParse(await req.json());
 if(!parsed.success)throw new ApiError(400,'Dados de login inválidos.');
 const email=normalizeEmail(parsed.data.email);
 const lock=await pool().query('SELECT blocked_until FROM auth_login_attempts WHERE email=$1',[email]);
 if(lock.rows[0]?.blocked_until && new Date(lock.rows[0].blocked_until).getTime()>Date.now())throw new ApiError(429,'Muitas tentativas. Tente novamente mais tarde.');
 const result=await pool().query('SELECT id::text,password_hash FROM app_users WHERE email=$1 AND active=true',[email]);
 const valid=await checkPassword(parsed.data.password,result.rows[0]?.password_hash||null);
 if(!valid){
  await pool().query("INSERT INTO auth_login_attempts(email,attempts,updated_at,blocked_until) VALUES($1,1,now(),null) ON CONFLICT(email) DO UPDATE SET attempts=CASE WHEN auth_login_attempts.updated_at < now()-interval '15 minutes' THEN 1 ELSE auth_login_attempts.attempts+1 END,updated_at=now(),blocked_until=CASE WHEN auth_login_attempts.updated_at>=now()-interval '15 minutes' AND auth_login_attempts.attempts>=4 THEN now()+interval '15 minutes' ELSE null END",[email]);
  throw new ApiError(401,'E-mail ou senha incorretos.');
 }
 await pool().query('DELETE FROM auth_login_attempts WHERE email=$1',[email]);
 await createSession(result.rows[0].id);
 return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return jsonError(e);}
}
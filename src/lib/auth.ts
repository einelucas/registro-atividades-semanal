
import 'server-only';
import { randomBytes, createHash, scrypt as rawScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies, headers } from 'next/headers';
import { pool, ApiError } from './server';
const scrypt=promisify(rawScrypt);
export const COOKIE='registro_session';
const TTL=60*60*24*7;
export function normalizeEmail(email:string){return email.trim().toLowerCase();}
export async function hashPassword(password:string) {
 const salt=randomBytes(16).toString('hex');
 const digest=await scrypt(password,Buffer.from(salt,'hex'),64) as Buffer;
 return 'scrypt$'+salt+'$'+digest.toString('hex');
}
export async function checkPassword(password:string,encoded:string|null) {
 if(!encoded)return false;
 const [alg,salt,hash]=encoded.split('$');
 if(alg!=='scrypt'||!/^[a-f0-9]{32}$/.test(salt||'')||!/^[a-f0-9]{128}$/.test(hash||''))return false;
 const expected=Buffer.from(hash,'hex');
 const actual=await scrypt(password,Buffer.from(salt,'hex'),64) as Buffer;
 return timingSafeEqual(actual,expected);
}
export type SessionUser={id:string;name:string;email:string;role:'MANAGER'|'COLLABORATOR'};
export async function sessionUser():Promise<SessionUser|null> {
 const value=(await cookies()).get(COOKIE)?.value;
 if(!value||!/^[a-f0-9]{64}$/.test(value))return null;
 const hash=createHash('sha256').update(value).digest('hex');
 const result=await pool().query(
  "SELECT u.id::text,u.display_name AS name,u.email,u.role FROM app_sessions s JOIN app_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true AND u.password_hash IS NOT NULL",[hash]);
 return result.rows[0]||null;
}
export async function createSession(userId:string) {
 const token=randomBytes(32).toString('hex');
 await pool().query("INSERT INTO app_sessions(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '7 days')",[userId,createHash('sha256').update(token).digest('hex')]);
 (await cookies()).set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:TTL});
}
export async function clearSession() {
 const jar=await cookies();
 const token=jar.get(COOKIE)?.value;
 if(token)await pool().query('DELETE FROM app_sessions WHERE token_hash=$1',[createHash('sha256').update(token).digest('hex')]);
 jar.delete(COOKIE);
}
export async function checkOrigin(request:Request) {
 const origin=request.headers.get('origin');
 const host=(await headers()).get('x-forwarded-host') || (await headers()).get('host');
 if(!origin||!host)throw new ApiError(403,'Origem da requisição não permitida');
 let parsed:URL;
 try{parsed=new URL(origin);}catch{throw new ApiError(403,'Origem inválida');}
 if(parsed.host!==host)throw new ApiError(403,'Origem da requisição não permitida');
}

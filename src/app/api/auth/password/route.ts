import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {pool,ApiError,jsonError} from '@/lib/server';
import {sessionUser,checkPassword,hashPassword,checkOrigin} from '@/lib/auth';
export const runtime='nodejs';
const schema=z.object({currentPassword:z.string().min(1).max(128),newPassword:z.string().min(12).max(128)}).strict();
export async function POST(req:NextRequest){
 try{
 await checkOrigin(req);
 const user=await sessionUser();if(!user)throw new ApiError(401,'Não autenticado');
 const parsed=schema.safeParse(await req.json());if(!parsed.success)throw new ApiError(400,'Nova senha deve ter no mínimo 12 caracteres');
 const existing=await pool().query('SELECT password_hash FROM app_users WHERE id=$1',[user.id]);
 if(!await checkPassword(parsed.data.currentPassword,existing.rows[0]?.password_hash))throw new ApiError(401,'Senha atual incorreta');
 await pool().query('UPDATE app_users SET password_hash=$1 WHERE id=$2',[await hashPassword(parsed.data.newPassword),user.id]);
 await pool().query("DELETE FROM app_sessions WHERE user_id=$1 AND token_hash<>$2",[user.id,await sessionTokenHash()]);
 return NextResponse.json({ok:true});
 }catch(e){return jsonError(e);}
}
async function sessionTokenHash(){const {cookies}=await import('next/headers');const {createHash}=await import('node:crypto');const value=(await cookies()).get('registro_session')?.value||'';return createHash('sha256').update(value).digest('hex');}
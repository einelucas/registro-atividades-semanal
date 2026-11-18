import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {pool,ApiError,jsonError} from '@/lib/server';
import {hashPassword,normalizeEmail,createSession,checkOrigin} from '@/lib/auth';
export const runtime='nodejs';
const schema=z.object({name:z.string().trim().min(2).max(120),email:z.email().max(250),password:z.string().min(12).max(128)}).strict();
export async function POST(req:NextRequest){
 try{
 await checkOrigin(req);
 const parsed=schema.safeParse(await req.json());
 if(!parsed.success)throw new ApiError(400,'Informe nome, e-mail válido e senha de pelo menos 12 caracteres.');
 const {name,password}=parsed.data,email=normalizeEmail(parsed.data.email);
 const hashed=await hashPassword(password);
 const result=await pool().query("INSERT INTO app_users(display_name,email,password_hash,role,active) VALUES($1,$2,$3,'COLLABORATOR',true) RETURNING id::text",[name,email,hashed]);
 await createSession(result.rows[0].id);
 return NextResponse.json({ok:true},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(e){return jsonError(e);}
}
import {NextResponse} from 'next/server';
import {sessionUser} from '@/lib/auth';
export const runtime='nodejs';
export async function GET(){const user=await sessionUser();return NextResponse.json(user||{error:'Não autenticado'},{status:user?200:401,headers:{'Cache-Control':'no-store'}});}
import {NextRequest,NextResponse} from 'next/server';
import {clearSession,checkOrigin} from '@/lib/auth';
import {jsonError} from '@/lib/server';
export const runtime='nodejs';
export async function POST(req:NextRequest){try{await checkOrigin(req);await clearSession();return NextResponse.json({ok:true});}catch(e){return jsonError(e);}}
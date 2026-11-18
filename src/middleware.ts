import {NextResponse,type NextRequest} from 'next/server';
export function middleware(req:NextRequest){
 const response=NextResponse.next();
 response.headers.set('X-Content-Type-Options','nosniff');
 response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
 return response;
}
export const config={matcher:'/api/:path*'};
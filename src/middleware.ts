import {NextRequest,NextResponse} from 'next/server';
export function middleware(req:NextRequest){
 const origin=req.headers.get('origin');
 const allow=(process.env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
 const accepted=origin&&allow.includes(origin);
 if(req.method==='OPTIONS') {
  if(!accepted)return new NextResponse(null,{status:403});
  return new NextResponse(null,{status:204,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Max-Age':'600','Vary':'Origin'}});
 }
 const response=NextResponse.next();
 if(accepted){response.headers.set('Access-Control-Allow-Origin',origin);response.headers.set('Vary','Origin');}
 return response;
}
export const config={matcher:'/api/:path*'};

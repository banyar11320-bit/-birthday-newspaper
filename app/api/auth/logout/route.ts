import { cookies } from 'next/headers';
import { COOKIE } from '@/lib/auth';
import { sameOrigin, json, failure } from '@/lib/http';
export async function POST(request:Request){try{sameOrigin(request);(await cookies()).set(COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0});return json({ok:true});}catch(error){return failure(error);}}

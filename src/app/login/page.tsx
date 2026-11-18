import {redirect} from 'next/navigation';
import {sessionUser} from '@/lib/auth';
import LoginClient from './LoginClient';
export default async function LoginPage(){if(await sessionUser())redirect('/');return <LoginClient/>;}
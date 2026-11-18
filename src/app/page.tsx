import {redirect} from 'next/navigation';
import {sessionUser} from '@/lib/auth';
import App from '@/components/App';
export default async function Home(){if(!await sessionUser())redirect('/login');return <App/>;}
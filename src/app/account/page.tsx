import {redirect} from 'next/navigation';
import {sessionUser} from '@/lib/auth';
import PasswordForm from './PasswordForm';
export default async function AccountPage(){const user=await sessionUser();if(!user)redirect('/login');return <PasswordForm name={user.name} email={user.email}/>;}
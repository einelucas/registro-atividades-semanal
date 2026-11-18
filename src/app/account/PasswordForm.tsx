'use client';
import {useState,type FormEvent} from 'react';
import {ThemeProvider} from '@mui/material/styles';
import {Box,Card,CardContent,Typography,TextField,Button,Alert,Stack} from '@mui/material';
import {theme} from '@/lib/theme';
export default function PasswordForm({name,email}:{name:string;email:string}){
 const [currentPassword,setCurrent]=useState(''),[newPassword,setNext]=useState(''),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
 async function submit(e:FormEvent){e.preventDefault();setError('');setSuccess('');if(newPassword!==confirm){setError('As senhas não conferem.');return;}setBusy(true);
 try{const res=await fetch('/api/auth/password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword,newPassword})});
 const result=await res.json().catch(()=>({}));if(!res.ok)throw new Error(result.error||'Erro ao alterar senha');setCurrent('');setNext('');setConfirm('');setSuccess('Senha alterada.');}catch(e){setError(e instanceof Error?e.message:'Erro ao alterar senha');}finally{setBusy(false);}}
 return <ThemeProvider theme={theme}><Box sx={{maxWidth:530,mx:'auto',p:3,mt:5}}><Button href="/" sx={{mb:2}}>Voltar para o painel</Button><Card><CardContent sx={{p:4}}>
 <Typography variant="h4" fontWeight={800} gutterBottom>Minha conta</Typography><Typography color="text.secondary">{name} • {email}</Typography>
 <Typography variant="h6" sx={{mt:4,mb:2}}>Alterar senha</Typography>
 <form onSubmit={submit}><Stack gap={2}>
 {error&&<Alert severity="error">{error}</Alert>}{success&&<Alert severity="success">{success}</Alert>}
 <TextField required type="password" label="Senha atual" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrent(e.target.value)}/>
 <TextField required type="password" label="Nova senha" autoComplete="new-password" value={newPassword} onChange={e=>setNext(e.target.value)} inputProps={{minLength:12}} helperText="Mínimo de 12 caracteres"/>
 <TextField required type="password" label="Confirme a nova senha" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/>
 <Button disabled={busy} type="submit" variant="contained" size="large">{busy?'Salvando...':'Salvar nova senha'}</Button></Stack></form>
 </CardContent></Card></Box></ThemeProvider>;
}
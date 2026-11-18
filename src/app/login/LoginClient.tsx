'use client';
import {useState,type FormEvent} from 'react';
import {Box,Button,TextField,Typography,Alert,CircularProgress} from '@mui/material';
import {ThemeProvider} from '@mui/material/styles';
import {theme} from '@/lib/theme';
export default function LoginClient(){
 const [register,setRegister]=useState(false),[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[show,setShow]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(e:FormEvent){
 e.preventDefault();setBusy(true);setError('');
 try{
 const res=await fetch(register?'/api/auth/register':'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(register?{name,email,password}:{email,password})});
 const json=await res.json().catch(()=>({}));
 if(!res.ok)throw new Error(json.error||'Não foi possível autenticar');
 window.location.assign('/');
 }catch(e){setError(e instanceof Error?e.message:'Falha de autenticação');setBusy(false);}
 }
 return <ThemeProvider theme={theme}><div className="login-layout">
 <div className="login-hero"><div><Typography variant="overline" fontWeight={800} sx={{letterSpacing:3}}>INPASA • PROJETOS & ARQUITETURA</Typography><h1>Seu trabalho.<br/>Mais visível.<br/>Mais simples.</h1><Typography sx={{maxWidth:440,lineHeight:1.7,color:'#d2e1f5'}}>Registre suas entregas em segundos. Transforme a rotina da equipe em informações claras para a gestão.</Typography></div><span className="login-foot">Plataforma de registro semanal • Acesso seguro</span></div>
 <div className="login-box"><Box component="form" onSubmit={submit} sx={{width:'100%',maxWidth:420,mx:'auto'}}>
 <img src="/logo-inpasa.png" alt="Inpasa" style={{width:155,height:75,objectFit:'contain',objectPosition:'left'}}/>
 <Typography variant="h4" sx={{mt:3,mb:1,fontWeight:800}}>{register?'Criar conta':'Bem-vindo(a).'}</Typography>
 <Typography color="text.secondary" sx={{mb:3}}>{register?'Cadastre-se para registrar suas atividades.':'Entre com seu e-mail e senha para continuar.'}</Typography>
 {error&&<Alert severity="error" sx={{mb:2}}>{error}</Alert>}
 {register&&<TextField fullWidth required label="Nome completo" autoComplete="name" value={name} onChange={e=>setName(e.target.value)} inputProps={{maxLength:120}} sx={{mb:2}}/>}
 <TextField fullWidth required type="email" label="E-mail" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} sx={{mb:2}}/>
 <TextField fullWidth required type={show?'text':'password'} label="Senha" autoComplete={register?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} inputProps={{minLength:register?12:1,maxLength:128}} helperText={register?'Mínimo de 12 caracteres.':''} sx={{mb:1}}/>
 <Button type="button" size="small" onClick={()=>setShow(v=>!v)} sx={{mb:2}}>{show?'Ocultar senha':'Mostrar senha'}</Button>
 <Button type="submit" disabled={busy} fullWidth size="large" variant="contained" sx={{py:1.5}}>{busy?<CircularProgress size={22} color="inherit"/>:register?'Criar conta':'Entrar no aplicativo'}</Button>
 <Button type="button" fullWidth onClick={()=>{setRegister(v=>!v);setError('');setPassword('');}} sx={{mt:2}}>{register?'Já possui uma conta? Fazer login':'Ainda não tem conta? Cadastre-se'}</Button>
 </Box></div></div></ThemeProvider>;
}
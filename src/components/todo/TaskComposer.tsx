'use client';
import React, { useState } from 'react';
import { CalendarDays, Plus, Star } from 'lucide-react';

type Props = { onAdd: (title: string, important: boolean) => void; busy: boolean };
export function TaskComposer({onAdd,busy}:Props) {
  const [title,setTitle]=useState('');
  const [important,setImportant]=useState(false);
  const submit=(event:React.FormEvent)=>{
    event.preventDefault();
    const value=title.trim();
    if(!value||busy)return;
    onAdd(value,important);
    setTitle('');
    setImportant(false);
  };
  return (
    <form className="todo-composer" onSubmit={submit}>
      <Plus size={21} className="todo-composer-plus"/>
      <input value={title} onChange={event=>setTitle(event.target.value)} placeholder="Adicionar uma tarefa" aria-label="Adicionar tarefa" maxLength={300}/>
      <button type="button" title="Marcar como importante" aria-label="Marcar tarefa como importante" onClick={()=>setImportant(value=>!value)} className={'todo-compose-star'+(important?' is-active':'')}><Star size={18} fill={important?'currentColor':'none'}/></button>
      <button type="submit" className="todo-composer-submit" disabled={!title.trim()||busy}>Adicionar</button>
    </form>
  );
}

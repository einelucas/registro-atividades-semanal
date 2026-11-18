'use client';
import React, { useEffect, useState } from 'react';
import {
  Box, Divider, FormControl, IconButton, MenuItem, Select, TextField, Tooltip, Typography,
} from '@mui/material';
import {
  AlarmClock, CalendarDays, Check, ChevronRight, ListChecks, Plus, Repeat2,
  Star, Sun, Trash2, X,
} from 'lucide-react';
import type { TodoList, TodoStep, TodoTask } from './types';
import { todayISO } from './types';

type Props = {
  task: TodoTask;
  steps: TodoStep[];
  lists: TodoList[];
  busy: boolean;
  onClose: () => void;
  onPatch: (patch: Record<string, unknown>) => void;
  onToggle: () => void;
  onAddStep: (title: string) => void;
  onPatchStep: (id:string,patch:Record<string,unknown>) => void;
  onDeleteStep: (id:string) => void;
  onDelete: () => void;
  onSettings: () => void;
};
const inputDateTime = (value: string | null) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
};
export function TaskDetails({
  task,steps,lists,busy,onClose,onPatch,onToggle,onAddStep,onPatchStep,onDeleteStep,onDelete,onSettings,
}:Props) {
  const [newStep,setNewStep]=useState('');
  const [note,setNote]=useState(task.note);
  const [taskTitle,setTaskTitle]=useState(task.title);
  useEffect(()=>{setNote(task.note);setNewStep('');},[task.id,task.note]);
  useEffect(()=>{setTaskTitle(task.title);},[task.id,task.title]);
  const completed=!!task.completedAt;
  return (
    <aside className="todo-details" aria-label="Detalhes da tarefa">
      <div className="todo-details-scroll">
        <section className="todo-details-card">
          <div className="todo-details-title">
            <button type="button" className={'todo-circle'+(completed?' is-checked':'')} onClick={onToggle} disabled={busy} aria-label={completed?'Reabrir tarefa':'Concluir tarefa'}>{completed&&<Check size={15} strokeWidth={3}/>}</button>
            <input
              className={'todo-details-task-name'+(completed?' is-done':'')}
              aria-label="Nome da tarefa"
              title="Clique para renomear a tarefa"
              value={taskTitle}
              maxLength={300}
              disabled={busy}
              onChange={event=>setTaskTitle(event.target.value)}
              onBlur={event=>{
                const value=event.currentTarget.value.trim();
                if(value && value!==task.title){
                  setTaskTitle(value);
                  onPatch({title:value});
                }else{
                  setTaskTitle(task.title);
                }
              }}
              onKeyDown={event=>{
                if(event.key==='Enter'){
                  event.preventDefault();
                  event.currentTarget.blur();
                }else if(event.key==='Escape'){
                  event.currentTarget.value=task.title;
                  setTaskTitle(task.title);
                  event.currentTarget.blur();
                }
              }}
            />
            <Tooltip title={task.important?'Remover importância':'Marcar como importante'}><IconButton onClick={()=>onPatch({important:!task.important})} disabled={busy} size="small"><Star size={18} color={task.important?'#d29a19':'#768296'} fill={task.important?'#d29a19':'none'}/></IconButton></Tooltip>
          </div>
          <div className="todo-steps">
            {steps.map(step=>(
              <div className="todo-step" key={step.id}>
                <button className={'todo-circle todo-circle--small'+(step.completed?' is-checked':'')} disabled={busy} aria-label={step.completed?'Reabrir etapa':'Concluir etapa'} onClick={()=>onPatchStep(step.id,{completed:!step.completed})}>{step.completed&&<Check size={12} strokeWidth={3}/>}</button>
                <span className={step.completed?'is-done':''}>{step.title}</span>
                <IconButton size="small" disabled={busy} aria-label="Excluir etapa" onClick={()=>onDeleteStep(step.id)}><X size={15}/></IconButton>
              </div>
            ))}
            <form className="todo-step-add" onSubmit={event=>{event.preventDefault();if(!newStep.trim())return;onAddStep(newStep.trim());setNewStep('');}}>
              <Plus size={17}/>
              <input value={newStep} onChange={event=>setNewStep(event.target.value)} placeholder="Adicionar etapa" maxLength={250} aria-label="Nova etapa"/>
              <button type="submit" disabled={!newStep.trim()||busy}>Adicionar</button>
            </form>
          </div>
        </section>
        <section className="todo-details-card todo-details-links">
          <button type="button" className={'todo-detail-action'+(task.myDay===todayISO()?' is-active':'')} onClick={()=>onPatch({myDay:task.myDay===todayISO()?null:todayISO()})}>
            <Sun size={19}/><span>{task.myDay===todayISO()?'Adicionada a Meu Dia':'Adicionar a Meu Dia'}</span>{task.myDay===todayISO()&&<X size={16}/>}
          </button>
        </section>
        <section className="todo-details-card todo-details-options">
          <label><CalendarDays size={17}/><span>Data de vencimento</span></label>
          <TextField size="small" type="date" fullWidth value={task.dueDate||''} onChange={event=>onPatch({dueDate:event.target.value||null})} slotProps={{htmlInput:{'aria-label':'Data de vencimento'}}}/>
          <Divider/>
          <label><AlarmClock size={17}/><span>Lembrete</span></label>
          <TextField size="small" type="datetime-local" fullWidth value={inputDateTime(task.reminderAt)} onChange={event=>onPatch({reminderAt:event.target.value?new Date(event.target.value).toISOString():null})} slotProps={{htmlInput:{'aria-label':'Data e hora de lembrete'}}}/>
          <Divider/>
          <label><Repeat2 size={17}/><span>Repetir</span></label>
          <FormControl size="small" fullWidth>
            <Select value={task.repeatRule} onChange={event=>onPatch({repeatRule:event.target.value})} inputProps={{'aria-label':'Repetição'}}>
              <MenuItem value="NONE">Não repetir</MenuItem>
              <MenuItem value="DAILY">Diariamente</MenuItem>
              <MenuItem value="WEEKLY">Semanalmente</MenuItem>
              <MenuItem value="MONTHLY">Mensalmente</MenuItem>
            </Select>
          </FormControl>
          <Divider/>
          <label><ListChecks size={17}/><span>Lista</span></label>
          <FormControl size="small" fullWidth>
            <Select value={task.listId||''} onChange={event=>onPatch({listId:event.target.value||null})} inputProps={{'aria-label':'Lista da tarefa'}}>
              <MenuItem value="">Tarefas</MenuItem>
              {lists.map(list=><MenuItem key={list.id} value={list.id}>{list.name}</MenuItem>)}
            </Select>
          </FormControl>
        </section>
        <section className="todo-details-card todo-details-notes">
          <textarea value={note} onChange={event=>setNote(event.target.value)} onBlur={()=>{if(note!==task.note)onPatch({note});}} maxLength={10000} rows={4} placeholder="Adicionar observação" aria-label="Observação"/>
        </section>
        {completed && <section className="todo-details-card todo-sync-note">
          {task.activityId ? <><Check size={16}/> Registrada em Minhas Atividades.</> :
            <button type="button" onClick={onSettings}>Concluída, mas ainda não registrada. Configurar integração <ChevronRight size={15}/></button>}
        </section>}
      </div>
      <footer className="todo-details-footer">
        <Tooltip title="Fechar detalhes"><IconButton size="small" onClick={onClose}><X size={18}/></IconButton></Tooltip>
        <span>Criada em {new Date(task.createdAt).toLocaleDateString('pt-BR')}</span>
        <Tooltip title="Excluir tarefa"><IconButton size="small" onClick={onDelete} disabled={busy}><Trash2 size={18}/></IconButton></Tooltip>
      </footer>
    </aside>
  );
}

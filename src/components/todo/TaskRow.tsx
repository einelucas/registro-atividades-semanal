'use client';
import React from 'react';
import { CalendarDays, Check, ListChecks, Star, Sun } from 'lucide-react';
import type { TodoTask, TodoStep } from './types';
import { niceDate, todayISO } from './types';

type Props = {
  task: TodoTask;
  steps: TodoStep[];
  selected: boolean;
  listName?: string;
  onSelect: () => void;
  onToggle: () => void;
  onImportant: () => void;
  disabled?: boolean;
};

export function TaskRow({task,steps,selected,listName,onSelect,onToggle,onImportant,disabled}:Props){
  const checked=!!task.completedAt;
  const total=steps.length;
  const done=steps.filter(x=>x.completed).length;
  return (
    <div className={'todo-task-row'+(selected?' is-selected':'')+(checked?' is-done':'')} >
      <button type="button" disabled={disabled} className={'todo-circle'+(checked?' is-checked':'')} aria-label={checked?'Reabrir '+task.title:'Concluir '+task.title} onClick={onToggle}>
        {checked && <Check size={15} strokeWidth={3}/>}
      </button>
      <button type="button" className="todo-task-content" onClick={onSelect} aria-label={'Abrir detalhes: '+task.title}>
        <span className="todo-task-title">{task.title}</span>
        <span className="todo-task-meta">
          {listName && <span>{listName}</span>}
          {task.myDay && <span><Sun size={12}/> Meu Dia</span>}
          {task.dueDate && <span className={task.dueDate<todayISO()&&!checked?'is-overdue':''}><CalendarDays size={12}/>{niceDate(task.dueDate)}</span>}
          {total>0 && <span><ListChecks size={12}/>{done} de {total}</span>}
          {task.note && <span>Observação</span>}
          {checked && !task.activityId && <span className="todo-not-synced">Registro semanal pendente</span>}
        </span>
      </button>
      <button type="button" disabled={disabled} className={'todo-star'+(task.important?' is-important':'')} onClick={onImportant} aria-label={task.important?'Remover importância':'Marcar como importante'}>
        <Star size={20} fill={task.important?'currentColor':'none'} strokeWidth={1.8}/>
      </button>
    </div>
  );
}

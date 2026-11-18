'use client';
import React from 'react';
import { Avatar, Box, IconButton, InputBase, Tooltip } from '@mui/material';
import {
  CalendarDays, CheckCircle2, ChevronDown, Hash, Inbox, ListTodo,
  Menu as MenuIcon, MoreHorizontal, Plus, Search, Settings2, Star, Sun, X,
} from 'lucide-react';
import type { TodoList, TodoTask } from './types';

type Props = {
  view: string;
  setView: (view: string) => void;
  lists: TodoList[];
  tasks: TodoTask[];
  search: string;
  setSearch: (value: string) => void;
  onNewList: () => void;
  onEditList: (list: TodoList) => void;
  onSettings: () => void;
  personName: string;
  mobileOpen: boolean;
  onClose: () => void;
};

const sections = [
  { id: 'day', title: 'Meu Dia', Icon: Sun },
  { id: 'important', title: 'Importante', Icon: Star },
  { id: 'planned', title: 'Planejado', Icon: CalendarDays },
  { id: 'all', title: 'Todas', Icon: Inbox },
  { id: 'completed', title: 'Concluídas', Icon: CheckCircle2 },
];

export function TodoSidebar({
  view, setView, lists, tasks, search, setSearch, onNewList, onEditList,
  onSettings, personName, mobileOpen, onClose,
}: Props) {
  const today = new Date().toLocaleDateString('en-CA');
  const activeTasks = tasks.filter(task => !task.completedAt);
  const count = (id: string) => {
    if (id === 'day') return activeTasks.filter(t => t.myDay === today).length;
    if (id === 'important') return activeTasks.filter(t => t.important).length;
    if (id === 'planned') return activeTasks.filter(t => !!t.dueDate).length;
    if (id === 'all') return activeTasks.length;
    return tasks.filter(t => !!t.completedAt).length;
  };
  const navigate = (id: string) => { setView(id); onClose(); };
  return (
    <aside className={'todo-sidebar' + (mobileOpen ? ' todo-sidebar--open' : '')}>
      <div className="todo-sidebar-top">
        <div className="todo-profile">
          <Avatar sx={{width:36,height:36,bgcolor:'#5d78a5',fontSize:13,fontWeight:700}}>
            {personName.split(' ').slice(0,2).map(part=>part[0]).join('').toUpperCase()}
          </Avatar>
          <div className="todo-profile-label">
            <strong>{personName}</strong>
            <span>Minhas tarefas</span>
          </div>
          <IconButton className="todo-mobile-close" size="small" onClick={onClose} aria-label="Fechar menu"><X size={17}/></IconButton>
        </div>
        <div className="todo-search">
          <Search size={18}/>
          <InputBase
            value={search}
            onChange={event => { setSearch(event.target.value); if (event.target.value.trim()) setView('search'); }}
            placeholder="Pesquisar"
            inputProps={{'aria-label':'Pesquisar tarefas'}}
            sx={{fontSize:13,flex:1}}
          />
          {search && <button className="todo-mini-button" onClick={()=>{setSearch('');setView('all');}} aria-label="Limpar pesquisa"><X size={14}/></button>}
        </div>
        <nav aria-label="Listas inteligentes">
          {sections.map(({id,title,Icon})=>(
            <button key={id} type="button" onClick={()=>navigate(id)} className={'todo-nav-row' + (view===id?' is-active':'')}>
              <Icon size={18} strokeWidth={view===id?2.35:1.8} className={'todo-nav-icon todo-nav-'+id}/>
              <span>{title}</span>
              {count(id)>0 && <small>{count(id)}</small>}
            </button>
          ))}
        </nav>
      </div>
      <div className="todo-list-divider"/>
      <div className="todo-list-label"><ChevronDown size={13}/> LISTAS</div>
      <div className="todo-custom-lists">
        {lists.map(list=>{
          const qty=activeTasks.filter(t=>t.listId===list.id).length;
          return <div key={list.id} className={'todo-list-entry'+(view==='list:'+list.id?' is-active':'')}>
            <button type="button" className="todo-list-main" onClick={()=>navigate('list:'+list.id)}>
              <ListTodo size={17} style={{color:list.color}}/>
              <span title={list.name}>{list.name}</span>
              {qty>0 && <small>{qty}</small>}
            </button>
            <Tooltip title="Editar lista">
              <IconButton size="small" className="todo-list-actions" onClick={()=>onEditList(list)} aria-label={'Editar lista '+list.name}><MoreHorizontal size={16}/></IconButton>
            </Tooltip>
          </div>;
        })}
        {lists.length===0 && <div className="todo-list-empty">Organize seu trabalho criando uma lista.</div>}
      </div>
      <div className="todo-sidebar-footer">
        <button type="button" className="todo-new-list" onClick={onNewList}><Plus size={19}/> Nova lista</button>
        <Tooltip title="Configurações de registro semanal"><IconButton size="small" onClick={onSettings}><Settings2 size={19}/></IconButton></Tooltip>
      </div>
    </aside>
  );
}

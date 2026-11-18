'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, FormControlLabel, IconButton, Menu, MenuItem, Snackbar,
  Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import {
  ArrowDownAZ, ArrowUpDown, CalendarDays, CheckCircle2, ChevronDown, ChevronUp,
  ClipboardCheck, ListTodo, Menu as MenuIcon, MoreHorizontal, SlidersHorizontal,
  Star, Sun,
} from 'lucide-react';
import type { Option } from '@/lib/types';
import type { TodoList, TodoState, TodoTask } from './types';
import { dateSentence, todayISO } from './types';
import { TodoSidebar } from './TodoSidebar';
import { TaskRow } from './TaskRow';
import { TaskDetails } from './TaskDetails';
import { TaskComposer } from './TaskComposer';
import './todo.css';

type Props = {
  personName: string;
  units: Option[];
  categories: Option[];
  onActivityChange: () => Promise<unknown>;
};
const EMPTY: TodoState = {
  lists: [], tasks: [], steps: [],
  preferences: { unitId:null, categoryId:null, autoRegister:true },
};
const titles:Record<string,string> = {
  day:'Meu Dia',important:'Importante',planned:'Planejado',
  all:'Todas',completed:'Concluídas',search:'Pesquisa',
};
const colors=['#607caa','#8d65ba','#d56c78','#c78d43','#4b9a8e','#476eac'];
type SortMode='created'|'due'|'alpha';

export default function TodoWorkspace({personName,units,categories,onActivityChange}:Props){
  const [state,setState]=useState<TodoState>(EMPTY);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [view,setView]=useState('day');
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [search,setSearch]=useState('');
  const [mobileOpen,setMobileOpen]=useState(false);
  const [completedOpen,setCompletedOpen]=useState(false);
  const [sortMode,setSortMode]=useState<SortMode>('created');
  const [sortMenu,setSortMenu]=useState<HTMLElement|null>(null);
  const [listDialog,setListDialog]=useState(false);
  const [editingList,setEditingList]=useState<TodoList|null>(null);
  const [listName,setListName]=useState('');
  const [listColor,setListColor]=useState(colors[0]);
  const [settingsOpen,setSettingsOpen]=useState(false);
  const [unitId,setUnitId]=useState('');
  const [categoryId,setCategoryId]=useState('');
  const [autoRegister,setAutoRegister]=useState(true);

  const request=useCallback(async(method:'GET'|'POST'|'PATCH'|'DELETE',body?:Record<string,unknown>)=>{
    const response=await fetch('/api/todo',{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store'});
    const result=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(result.error || 'Não foi possível salvar as tarefas.');
    return result;
  },[]);
  const reload=useCallback(async()=>{
    const data=await request('GET') as TodoState;
    setState(data);
    return data;
  },[request]);
  useEffect(()=>{
    let live=true;
    reload().catch(error=>{if(live)setError(error instanceof Error?error.message:'Falha ao carregar tarefas.');})
      .finally(()=>{if(live)setLoading(false);});
    return ()=>{live=false;};
  },[reload]);

  const mutate=async(method:'POST'|'PATCH'|'DELETE', body:Record<string,unknown>, activityChanged=false)=>{
    if(busy)return null;
    setBusy(true);
    try {
      const response=await request(method,body);
      await reload();
      if(activityChanged) await onActivityChange();
      if(response.pending){
        setNotice('Tarefa concluída. Configure a unidade e a categoria para registrá-la em Minhas Atividades.');
        openSettings();
      } else if (response.linked && body.completed === true) {
        setNotice('Tarefa concluída e adicionada a Minhas Atividades.');
      }
      return response;
    }catch(e){
      setError(e instanceof Error?e.message:'Erro ao salvar.');
      return null;
    }finally{setBusy(false);}
  };
  const openSettings=()=>{
    setUnitId(state.preferences.unitId||'');
    setCategoryId(state.preferences.categoryId||'');
    setAutoRegister(state.preferences.autoRegister);
    setSettingsOpen(true);
  };
  const openNewList=()=>{
    setEditingList(null);setListName('');setListColor(colors[0]);setListDialog(true);
  };
  const openEditList=(list:TodoList)=>{
    setEditingList(list);setListName(list.name);setListColor(list.color);setListDialog(true);
  };
  const saveList=async()=>{
    if(!listName.trim())return;
    const result=await mutate(editingList?'PATCH':'POST',{
      kind:'list',...(editingList?{id:editingList.id}:{}),
      name:listName.trim(),color:listColor,
    });
    if(result){setListDialog(false);if(!editingList)setView('list:'+result.id);}
  };
  const deleteList=async()=>{
    if(!editingList||!window.confirm('Excluir esta lista? As tarefas serão mantidas em Todas.'))return;
    const result=await mutate('DELETE',{kind:'list',id:editingList.id});
    if(result){setListDialog(false);setView('all');setSelectedId(null);}
  };
  const saveSettings=async()=>{
    if(autoRegister && (!unitId||!categoryId)){
      setError('Selecione a unidade e a categoria para ativar o registro automático.');
      return;
    }
    const result=await mutate('PATCH',{kind:'preferences',unitId:unitId||null,categoryId:categoryId||null,autoRegister},true);
    if(result){
      setSettingsOpen(false);
      setNotice(result.linked>0?'Configurações salvas. '+result.linked+' tarefas concluídas foram registradas.':'Configurações salvas.');
    }
  };
  const addTask=async(title:string,important:boolean)=>{
    const listId=view.startsWith('list:')?view.slice(5):null;
    const result=await mutate('POST',{kind:'task',title,important,listId,myDay:view==='day'?todayISO():null});
    if(result)setSelectedId(result.id);
  };
  const patchTask=async(id:string,patch:Record<string,unknown>)=>{
    const result=await mutate('PATCH',{kind:'task',id,...patch},'completed' in patch);
    return result;
  };
  const toggleTask=(task:TodoTask)=>patchTask(task.id,{completed:!task.completedAt});
  const deleteTask=async(task:TodoTask)=>{
    if(!window.confirm('Excluir a tarefa "'+task.title+'"? O registro semanal já criado será preservado.'))return;
    const result=await mutate('DELETE',{kind:'task',id:task.id});
    if(result)setSelectedId(null);
  };
  const selected=state.tasks.find(task=>task.id===selectedId)||null;
  const listId=view.startsWith('list:')?view.slice(5):null;
  const selectedList=state.lists.find(list=>list.id===listId);
  const visible=useMemo(()=>{
    const today=todayISO();
    const query=search.trim().toLocaleLowerCase('pt-BR');
    const items=state.tasks.filter(task=>{
      if(view==='search')return !!query && (task.title+' '+task.note).toLocaleLowerCase('pt-BR').includes(query);
      if(view==='day')return task.myDay===today;
      if(view==='important')return task.important&&!task.completedAt;
      if(view==='planned')return !!task.dueDate&&!task.completedAt;
      if(view==='completed')return !!task.completedAt;
      if(view==='all')return !task.completedAt;
      if(listId)return task.listId===listId;
      return true;
    });
    return [...items].sort((a,b)=>{
      if(sortMode==='alpha')return a.title.localeCompare(b.title,'pt-BR');
      if(sortMode==='due')return (a.dueDate||'9999').localeCompare(b.dueDate||'9999')||b.createdAt.localeCompare(a.createdAt);
      return b.createdAt.localeCompare(a.createdAt);
    });
  },[view,search,state.tasks,listId,sortMode]);
  const pending=visible.filter(task=>!task.completedAt);
  const completed=visible.filter(task=>!!task.completedAt);
  const syncPending=state.tasks.filter(task=>task.completedAt&&!task.activityId).length;
  const title=selectedList?.name||titles[view]||'Tarefas';
  const headingIcon=view==='day'?<Sun size={30}/>:view==='important'?<Star size={28}/>:view==='planned'?<CalendarDays size={28}/>:view==='completed'?<CheckCircle2 size={28}/>:<ListTodo size={28}/>;
  const stepsFor=(id:string)=>state.steps.filter(step=>step.taskId===id);

  if(loading) return <Box className="todo-loading"><CircularProgress size={30}/><Typography>Carregando tarefas...</Typography></Box>;

  return (
    <div className={'todo-workspace'+(selected?' todo-workspace--details':'')}>
      <TodoSidebar
        view={view} setView={setView} lists={state.lists} tasks={state.tasks}
        search={search} setSearch={setSearch} personName={personName}
        onNewList={openNewList} onEditList={openEditList} onSettings={openSettings}
        mobileOpen={mobileOpen} onClose={()=>setMobileOpen(false)}
      />
      <section className={'todo-main'+(view==='day'?' todo-main--day':'')} aria-label={title}>
        <div className="todo-main-toolbar">
          <div className="todo-title-block">
            <IconButton className="todo-menu-toggle" onClick={()=>setMobileOpen(true)} aria-label="Abrir listas"><MenuIcon size={21}/></IconButton>
            <span className="todo-title-icon">{headingIcon}</span>
            <div><h2>{title}</h2>{view==='day'&&<p>{dateSentence()}</p>}</div>
          </div>
          <div className="todo-toolbar-right">
            <Tooltip title="Ordenar tarefas"><IconButton sx={{color:'inherit'}} onClick={event=>setSortMenu(event.currentTarget)} aria-label="Ordenar"><ArrowUpDown size={19}/></IconButton></Tooltip>
            <Menu anchorEl={sortMenu} open={!!sortMenu} onClose={()=>setSortMenu(null)}>
              {([{key:'created',title:'Mais recentes'},{key:'due',title:'Data de vencimento'},{key:'alpha',title:'Ordem alfabética'}] as {key:SortMode;title:string}[]).map(option=><MenuItem key={option.key} selected={sortMode===option.key} onClick={()=>{setSortMode(option.key);setSortMenu(null);}}>{option.title}</MenuItem>)}
            </Menu>
            <Tooltip title="Configurar registro semanal"><IconButton sx={{color:'inherit'}} aria-label="Configurar" onClick={openSettings}><SlidersHorizontal size={19}/></IconButton></Tooltip>
          </div>
        </div>
        {syncPending>0&&<button type="button" className="todo-sync-banner" onClick={openSettings}><ClipboardCheck size={16}/>{syncPending} tarefa(s) concluída(s) aguardando configuração do registro semanal.</button>}
        <div className="todo-task-scroll">
          {view==='completed'?(
            <>
              <div className="todo-group-heading">Concluídas <span>{completed.length}</span></div>
              {completed.map(task=><TaskRow key={task.id} task={task} selected={selectedId===task.id} listName={state.lists.find(list=>list.id===task.listId)?.name} steps={stepsFor(task.id)} onSelect={()=>setSelectedId(task.id)} onToggle={()=>toggleTask(task)} onImportant={()=>patchTask(task.id,{important:!task.important})} disabled={busy}/>)}
            </>
          ):(
            <>
              {pending.map(task=><TaskRow key={task.id} task={task} selected={selectedId===task.id} listName={view==='all'||view==='search'?state.lists.find(list=>list.id===task.listId)?.name:undefined} steps={stepsFor(task.id)} onSelect={()=>setSelectedId(task.id)} onToggle={()=>toggleTask(task)} onImportant={()=>patchTask(task.id,{important:!task.important})} disabled={busy}/>)}
              {completed.length>0&&<div className="todo-completed-group">
                <button type="button" className="todo-group-heading todo-group-button" onClick={()=>setCompletedOpen(value=>!value)}>
                  {completedOpen?<ChevronUp size={17}/>:<ChevronDown size={17}/>} Concluídas <span>{completed.length}</span>
                </button>
                {completedOpen&&completed.map(task=><TaskRow key={task.id} task={task} selected={selectedId===task.id} steps={stepsFor(task.id)} onSelect={()=>setSelectedId(task.id)} onToggle={()=>toggleTask(task)} onImportant={()=>patchTask(task.id,{important:!task.important})} disabled={busy}/>)}
              </div>}
            </>
          )}
          {visible.length===0&&<div className="todo-empty-state">
            <div className="todo-empty-illustration">{headingIcon}</div>
            <strong>{view==='day'?'Concentre-se no que importa hoje':view==='search'?'Nenhuma tarefa encontrada':'Tudo organizado por aqui'}</strong>
            <span>{view==='day'?'Adicione tarefas para planejar seu dia.':view==='completed'?'As tarefas concluídas aparecerão aqui.':'Suas tarefas aparecerão nesta lista.'}</span>
          </div>}
        </div>
        {view!=='completed'&&view!=='search'&&<TaskComposer busy={busy} onAdd={addTask}/>}
        <div className="todo-main-bottom">{pending.length} {pending.length===1?'tarefa pendente':'tarefas pendentes'}</div>
      </section>
      {selected&&<TaskDetails
        key={selected.id} task={selected} steps={stepsFor(selected.id)} lists={state.lists} busy={busy}
        onClose={()=>setSelectedId(null)} onPatch={patch=>{void patchTask(selected.id,patch);}}
        onToggle={()=>{void toggleTask(selected);}}
        onAddStep={title=>{void mutate('POST',{kind:'step',taskId:selected.id,title});}}
        onPatchStep={(id,patch)=>{void mutate('PATCH',{kind:'step',id,...patch});}}
        onDeleteStep={id=>{void mutate('DELETE',{kind:'step',id});}}
        onDelete={()=>{void deleteTask(selected);}}
        onSettings={openSettings}
      />}
      <Dialog open={listDialog} onClose={()=>!busy&&setListDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingList?'Editar lista':'Nova lista'}</DialogTitle>
        <DialogContent sx={{pt:'10px !important'}}>
          <TextField autoFocus fullWidth label="Nome da lista" value={listName} onChange={e=>setListName(e.target.value)} inputProps={{maxLength:100}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();void saveList();}}}/>
          <Typography variant="caption" sx={{display:'block',mt:2,mb:1}}>Cor da lista</Typography>
          <div className="todo-color-picker">{colors.map(color=><button key={color} type="button" style={{backgroundColor:color}} className={color===listColor?'selected':''} aria-label={'Selecionar cor '+color} onClick={()=>setListColor(color)}/>)}</div>
          {editingList&&<Button color="error" startIcon={<ListTodo size={15}/>} onClick={deleteList} sx={{mt:2,textTransform:'none'}}>Excluir lista</Button>}
        </DialogContent>
        <DialogActions><Button onClick={()=>setListDialog(false)}>Cancelar</Button><Button variant="contained" disabled={!listName.trim()||busy} onClick={saveList}>Salvar</Button></DialogActions>
      </Dialog>
      <Dialog open={settingsOpen} onClose={()=>!busy&&setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Integração com Minhas Atividades</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{mb:2,color:'text.secondary'}}>
            Tarefas concluídas são registradas no histórico semanal com a unidade e a categoria definidas abaixo. Nenhum serviço da Microsoft é utilizado.
          </Typography>
          <FormControlLabel control={<Switch checked={autoRegister} onChange={e=>setAutoRegister(e.target.checked)}/>} label="Registrar automaticamente ao concluir"/>
          <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'1fr 1fr'},gap:2,mt:2}}>
            <TextField size="small" select label="Unidade" value={unitId} onChange={e=>setUnitId(e.target.value)} fullWidth>
              <MenuItem value="">Selecione uma unidade</MenuItem>
              {units.map(unit=><MenuItem key={unit.id} value={unit.id}>{unit.name}</MenuItem>)}
            </TextField>
            <TextField size="small" select label="Categoria" value={categoryId} onChange={e=>setCategoryId(e.target.value)} fullWidth>
              <MenuItem value="">Selecione uma categoria</MenuItem>
              {categories.map(category=><MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}
            </TextField>
          </Box>
          {syncPending>0&&<Alert severity="info" sx={{mt:2}}>{syncPending} tarefa(s) já concluída(s) serão incluídas em Minhas Atividades assim que você salvar essas configurações com o registro automático ativado.</Alert>}
          <Typography variant="caption" color="text.secondary" sx={{display:'block',mt:2}}>Ao reabrir uma tarefa, o registro automático correspondente é removido. Ao excluir uma tarefa, a atividade registrada permanece no histórico.</Typography>
        </DialogContent>
        <DialogActions><Button onClick={()=>setSettingsOpen(false)}>Cancelar</Button><Button variant="contained" disabled={busy} onClick={saveSettings}>Salvar configurações</Button></DialogActions>
      </Dialog>
      <Snackbar open={!!notice} autoHideDuration={4500} onClose={()=>setNotice('')} anchorOrigin={{vertical:'bottom',horizontal:'center'}}><Alert severity="success" onClose={()=>setNotice('')}>{notice}</Alert></Snackbar>
      <Snackbar open={!!error} autoHideDuration={7500} onClose={()=>setError('')} anchorOrigin={{vertical:'top',horizontal:'center'}}><Alert severity="error" onClose={()=>setError('')}>{error}</Alert></Snackbar>
    </div>
  );
}

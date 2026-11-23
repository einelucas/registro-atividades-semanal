'use client';

import React, { useState } from 'react';
import { Plus, Star } from 'lucide-react';
import type { Option } from '@/lib/types';
import { TaskActivityFields } from './TaskActivityFields';

type Props = {
  onAdd: (task: { title: string; important: boolean; unitId: string | null; categoryId: string | null }) => Promise<boolean>;
  busy: boolean;
  autoRegister: boolean;
  units: Option[];
  categories: Option[];
};

export function TaskComposer({ onAdd, busy, autoRegister, units, categories }: Props) {
  const [title, setTitle] = useState('');
  const [important, setImportant] = useState(false);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const canSubmit = !!title.trim() && !busy && (!autoRegister || (
    units.some(unit => unit.id === unitId) && categories.some(category => category.id === categoryId)
  ));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (canSubmit && await onAdd({ title: title.trim(), important, unitId, categoryId })) {
      setTitle('');
      setImportant(false);
      setUnitId(null);
      setCategoryId(null);
    }
  };

  return (
    <form className="todo-composer" onSubmit={submit}>
      <div className="todo-composer-title">
        <Plus size={21} className="todo-composer-plus"/>
        <input className="todo-composer-input" value={title} onChange={event => setTitle(event.target.value)}
          placeholder="Adicionar uma tarefa" aria-label="Adicionar tarefa" maxLength={300} disabled={busy}/>
        <button type="button" title="Marcar como importante" aria-label="Marcar tarefa como importante"
          aria-pressed={important} disabled={busy} onClick={() => setImportant(value => !value)}
          className={'todo-compose-star' + (important ? ' is-active' : '')}>
          <Star size={18} fill={important ? 'currentColor' : 'none'}/>
        </button>
        <button type="submit" className="todo-composer-submit" disabled={!canSubmit}>Adicionar</button>
      </div>
      <div className="todo-composer-fields">
        <TaskActivityFields units={units} categories={categories} unitId={unitId} categoryId={categoryId}
          onUnitChange={setUnitId} onCategoryChange={setCategoryId} required={autoRegister} disabled={busy}/>
      </div>
    </form>
  );
}

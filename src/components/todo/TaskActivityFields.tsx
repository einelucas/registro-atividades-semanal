'use client';

import { Autocomplete, MenuItem, TextField } from '@mui/material';
import type { Option } from '@/lib/types';

type Props = {
  units: Option[];
  categories: Option[];
  unitId: string | null;
  categoryId: string | null;
  onUnitChange: (id: string) => void;
  onCategoryChange: (id: string | null) => void;
  disabled: boolean;
  required?: boolean;
  archivedUnit?: Option;
  archivedCategory?: Option;
  disableCategoryClear?: boolean;
};

export function TaskActivityFields({
  units, categories, unitId, categoryId, onUnitChange, onCategoryChange,
  disabled, required, archivedUnit, archivedCategory, disableCategoryClear,
}: Props) {
  const unit = units.find(option => option.id === unitId) ?? archivedUnit;
  const categoryOptions = archivedCategory ? [...categories, archivedCategory] : categories;
  return (
    <>
      <TextField
        select fullWidth size="small" label="Unidade" required={required} disabled={disabled}
        value={unit?.id ?? ''}
        onChange={event => onUnitChange(event.target.value)}
      >
        {archivedUnit && <MenuItem value={archivedUnit.id} disabled>{archivedUnit.name}</MenuItem>}
        {units.map(unit => <MenuItem key={unit.id} value={unit.id}>{unit.name}</MenuItem>)}
      </TextField>
      <Autocomplete
        fullWidth size="small" options={categoryOptions} disabled={disabled} disableClearable={disableCategoryClear}
        getOptionDisabled={option => option.id === archivedCategory?.id}
        value={categoryOptions.find(category => category.id === categoryId) ?? null}
        getOptionLabel={option => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        onChange={(_, category) => onCategoryChange(category?.id ?? null)}
        noOptionsText="Nenhuma categoria encontrada"
        renderInput={params => <TextField {...params} label="Categoria" required={required}/>}
      />
    </>
  );
}

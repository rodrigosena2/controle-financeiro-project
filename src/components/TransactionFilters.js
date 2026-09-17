import React, { useEffect, useState } from "react";
import { FiSliders } from "react-icons/fi";
import { Button, Field, Input, Label, Select } from "../styles/ui";
import * as C from "./TransactionFilters.styles";

const iso = date => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const month = offset => {
  const now = new Date();
  return { from: iso(new Date(now.getFullYear(), now.getMonth() + offset, 1)),
    to: iso(new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)) };
};

export default function TransactionFilters({ filters, categories, disabled, onApply }) {
  const [draft, setDraft] = useState(filters);
  const [period, setPeriod] = useState("current");
  const [expanded, setExpanded] = useState(() => window.matchMedia?.("(min-width: 768px)").matches ?? true);
  useEffect(() => { setDraft(filters); }, [filters]);
  const change = (name, value) => setDraft(previous => ({ ...previous, [name]: value }));
  const changePeriod = value => {
    setPeriod(value);
    if (value === "current") setDraft(previous => ({ ...previous, ...month(0) }));
    if (value === "previous") setDraft(previous => ({ ...previous, ...month(-1) }));
  };
  const options = draft.type === "Income" ? categories.income
    : draft.type === "Expense" ? categories.expense : [...categories.income, ...categories.expense];
  return <C.Disclosure open={expanded} onToggle={event => setExpanded(event.currentTarget.open)}>
    <summary><FiSliders aria-hidden="true" />Filtros e ordenação</summary>
    <C.Form aria-label="Filtros de transações" onSubmit={event => { event.preventDefault(); onApply(draft); }}>
    <C.Fields>
      <Field><Label htmlFor="filter-period">Período</Label><Select id="filter-period" value={period} disabled={disabled}
        onChange={event => changePeriod(event.target.value)}>
        <option value="current">Mês atual</option><option value="previous">Mês anterior</option><option value="custom">Personalizado</option>
      </Select></Field>
      <Field><Label htmlFor="filter-search">Buscar descrição</Label><Input id="filter-search" type="search" maxLength={200}
        placeholder="Ex: mercado" value={draft.search} disabled={disabled} onChange={event => change("search", event.target.value)} /></Field>
      <Field><Label htmlFor="filter-type">Tipo</Label><Select id="filter-type" value={draft.type} disabled={disabled}
        onChange={event => { change("type", event.target.value); change("category", ""); }}>
        <option value="">Todos</option><option value="Income">Receitas</option><option value="Expense">Despesas</option>
      </Select></Field>
      <Field><Label htmlFor="filter-category">Categoria</Label><Select id="filter-category" value={draft.category} disabled={disabled}
        onChange={event => change("category", event.target.value)}><option value="">Todas</option>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </Select></Field>
      <Field><Label htmlFor="filter-from">Data inicial</Label><Input id="filter-from" type="date" value={draft.from}
        disabled={disabled} onChange={event => { setPeriod("custom"); change("from", event.target.value); }} /></Field>
      <Field><Label htmlFor="filter-to">Data final</Label><Input id="filter-to" type="date" value={draft.to}
        disabled={disabled} onChange={event => { setPeriod("custom"); change("to", event.target.value); }} /></Field>
      <Field><Label htmlFor="filter-sort">Ordenar por</Label><Select id="filter-sort" value={draft.sortBy} disabled={disabled}
        onChange={event => change("sortBy", event.target.value)}><option value="Date">Data</option><option value="Amount">Valor</option><option value="Description">Descrição</option>
      </Select></Field>
      <Field><Label htmlFor="filter-direction">Direção</Label><Select id="filter-direction" value={draft.sortDirection} disabled={disabled}
        onChange={event => change("sortDirection", event.target.value)}><option value="Desc">Decrescente</option><option value="Asc">Crescente</option>
      </Select></Field>
    </C.Fields>
      <C.Actions><Button type="submit" disabled={disabled}>Aplicar filtros</Button></C.Actions>
    </C.Form>
  </C.Disclosure>;
}

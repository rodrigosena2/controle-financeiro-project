import React, { useEffect, useRef, useState } from "react";
import { FiCheck, FiPlus, FiX } from "react-icons/fi";
import Grid from "../Grid/Grid";
import { Button, Actions, FieldError, Hint } from "../../styles/ui";
import * as C from "./styles";

const localToday = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export default function Form({ handleAdd, onUpdate, transactionsList, onDelete, onEndRecurrence,
  categories, filters, paging, onFilters, onPage, panelOpen, onPanelOpen, onPanelClose,
  disabled = false, showEmpty = true }) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [isExpense, setExpense] = useState(false);
  const [date, setDate] = useState(localToday);
  const [category, setCategory] = useState("Salary");
  const [recurrenceFrequency, setRecurrenceFrequency] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const description = useRef(null);
  const drawer = useRef(null);

  useEffect(() => {
    if (!panelOpen) return;
    const element = drawer.current;
    if (!element.open) {
      element.showModal();
      description.current?.focus();
    }
  }, [panelOpen]);

  const clear = name => setErrors(previous => ({ ...previous, [name]: "" }));
  const reset = () => {
    setErrors({}); setEditingId(null); setDesc(""); setAmount(""); setExpense(false);
    setCategory("Salary"); setRecurrenceFrequency(""); setDate(localToday());
  };
  const closePanel = () => { reset(); onPanelClose(); };
  const startEdit = item => {
    setErrors({}); setEditingId(item.id); setDesc(item.desc); setAmount(String(item.amount));
    setExpense(item.expense); setCategory(item.category); setRecurrenceFrequency("");
    setDate(item.date || localToday()); onPanelOpen();
  };
  const handleSave = async event => {
    event.preventDefault();
    if (busy || disabled) return;
    const next = {};
    if (desc.trim().length < 3) next.description = "Use pelo menos 3 caracteres para a descrição.";
    if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) next.amount = "Informe um valor maior que zero.";
    else if (event.currentTarget.elements.amount.validity.stepMismatch) next.amount = "Use até duas casas decimais.";
    if (!date) next.date = "Informe a data da transação.";
    if (!category) next.category = "Selecione uma categoria.";
    setErrors(next);
    if (Object.keys(next).length) { event.currentTarget.elements[Object.keys(next)[0]].focus(); return; }
    setBusy(true);
    try {
      const transaction = { date, desc, amount, expense: isExpense, category, recurrenceFrequency };
      const success = editingId ? await onUpdate(editingId, transaction) : await handleAdd(transaction);
      if (success) closePanel();
    } finally { setBusy(false); }
  };

  return <C.Workspace id="transactions">
    <Grid itens={transactionsList} disabled={disabled || busy} showEmpty={showEmpty}
      categories={categories} filters={filters} paging={paging} onFilters={onFilters} onPage={onPage}
      onEndRecurrence={onEndRecurrence}
      onDelete={async id => {
        const deleted = await onDelete(id);
        if (deleted && editingId === id) closePanel();
        return deleted;
      }} onEdit={startEdit} />
    {panelOpen && <C.Drawer ref={drawer} aria-labelledby="transaction-form-title"
      onCancel={event => { event.preventDefault(); if (!busy) closePanel(); }}>
      <C.DrawerHeader><div><C.Kicker>{editingId ? "Ajustar lançamento" : "Novo lançamento"}</C.Kicker>
        <h2 id="transaction-form-title">{editingId ? "Editar transação" : "Nova transação"}</h2>
        <Hint>{editingId ? "Ajuste os dados e salve as alterações." : "Registre uma entrada ou saída sem sair do seu panorama."}</Hint></div>
        <C.Close type="button" disabled={busy} onClick={closePanel} aria-label="Fechar formulário"><FiX aria-hidden="true" /></C.Close>
      </C.DrawerHeader>
      <form onSubmit={handleSave} noValidate aria-label={editingId ? "Editar transação" : "Nova transação"}>
        <C.Fields disabled={disabled || busy}>
          <C.RadioGroup><legend>Tipo de transação</legend><div>
            <label><input type="radio" checked={!isExpense} name="type" value="Income"
              onChange={() => { setExpense(false); setCategory("Salary"); }} />Entrada</label>
            <label><input type="radio" checked={isExpense} name="type" value="Expense"
              onChange={() => { setExpense(true); setCategory("Food"); }} />Saída</label>
          </div></C.RadioGroup>
          <C.InputContent>
            <C.Label htmlFor="transaction-description">Descrição</C.Label>
            <C.Input ref={description} id="transaction-description" name="description" required minLength={3} maxLength={200}
              placeholder="Ex: salário, luz..." value={desc} aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "description-error" : undefined}
              onChange={event => { setDesc(event.target.value); clear("description"); }} />
            {errors.description && <FieldError role="alert" id="description-error">{errors.description}</FieldError>}
          </C.InputContent>
          <C.InputContent>
            <C.Label htmlFor="transaction-category">Categoria</C.Label>
            <C.Select id="transaction-category" name="category" required value={category} aria-invalid={!!errors.category}
              aria-describedby={errors.category ? "category-error" : undefined}
              onChange={event => { setCategory(event.target.value); clear("category"); }}>
              {(isExpense ? categories.expense : categories.income).map(option =>
                <option key={option.value} value={option.value}>{option.label}</option>)}
            </C.Select>
            {errors.category && <FieldError role="alert" id="category-error">{errors.category}</FieldError>}
          </C.InputContent>
          <C.Pair>
            <C.InputContent><C.Label htmlFor="transaction-amount">Valor</C.Label>
              <C.Input id="transaction-amount" name="amount" required min="0.01" step="0.01" inputMode="decimal"
                placeholder="0,00" value={amount} type="number" aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? "amount-error" : "amount-hint"}
                onChange={event => { setAmount(event.target.value); clear("amount"); }} />
              {errors.amount ? <FieldError role="alert" id="amount-error">{errors.amount}</FieldError> : <Hint id="amount-hint">Valor em reais (R$).</Hint>}
            </C.InputContent>
            <C.InputContent><C.Label htmlFor="transaction-date">Data</C.Label>
              <C.Input id="transaction-date" name="date" type="date" required value={date} aria-invalid={!!errors.date}
                aria-describedby={errors.date ? "date-error" : undefined}
                onChange={event => { setDate(event.target.value); clear("date"); }} />
              {errors.date && <FieldError role="alert" id="date-error">{errors.date}</FieldError>}
            </C.InputContent>
          </C.Pair>
          {!editingId ? <C.InputContent><C.Label htmlFor="transaction-recurrence">Recorrência</C.Label>
            <C.Select id="transaction-recurrence" value={recurrenceFrequency}
              onChange={event => setRecurrenceFrequency(event.target.value)}>
              <option value="">Não recorrente</option><option value="Monthly">Mensal</option><option value="Weekly">Semanal</option>
            </C.Select>
            <Hint>Ocorrências vencidas são criadas uma única vez quando os dados são consultados.</Hint>
          </C.InputContent> : transactionsList.find(item => item.id === editingId)?.recurrenceId &&
            <Hint>Esta edição altera somente a ocorrência selecionada. Use “Encerrar recorrência” para impedir novas ocorrências.</Hint>}
          <Actions>
            {editingId && <Button type="button" $variant="secondary" disabled={busy} onClick={closePanel}>Cancelar edição</Button>}
            <Button type="submit" disabled={busy} aria-label={editingId ? "ATUALIZAR" : "ADICIONAR"}>
              {editingId ? <FiCheck aria-hidden="true" /> : <FiPlus aria-hidden="true" />}
              {busy ? "Salvando..." : editingId ? "Salvar alterações" : "Adicionar transação"}
            </Button>
          </Actions>
        </C.Fields>
      </form>
    </C.Drawer>}
  </C.Workspace>;
}

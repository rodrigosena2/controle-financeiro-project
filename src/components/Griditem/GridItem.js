import React from "react";
import { FiArrowUpRight, FiArrowDownLeft, FiTrash2, FiEdit2, FiRepeat } from "react-icons/fi";
import { Button } from "../../styles/ui";
import { formatMoney, formatDate } from "../../format";
import * as C from "./styles";

export default function GridItem({ item, onDelete, onEdit, onEndRecurrence, disabled }) {
  return <C.Row>
    <C.Description><C.TransactionIcon $expense={item.expense}>
      {item.expense ? <FiArrowUpRight aria-hidden="true" /> : <FiArrowDownLeft aria-hidden="true" />}
    </C.TransactionIcon><div><h3>{item.desc}</h3><C.Type $expense={item.expense}>
      {item.expense ? "Despesa" : "Receita"}</C.Type>
      {item.recurrenceId && <C.Meta><FiRepeat aria-hidden="true" />{item.recurrenceFrequency === "Weekly" ? "Semanal" : "Mensal"}{item.isRecurrenceActive ? " · ativa" : " · encerrada"}</C.Meta>}
    </div>
    </C.Description>
    <C.Category>{item.categoryLabel}</C.Category>
    <C.Date dateTime={item.date}>{formatDate(item.date)}</C.Date>
    <C.Amount $expense={item.expense}>{item.expense ? "− " : "+ "}{formatMoney(item.amount)}</C.Amount>
    <C.Actions>
      <Button type="button" $variant="secondary" disabled={disabled} aria-label={`Editar ${item.desc}`} onClick={() => onEdit(item)}>
        <FiEdit2 aria-hidden="true" />Editar
      </Button>
      <Button type="button" $variant="danger" disabled={disabled} aria-label={`Excluir ${item.desc}`} onClick={onDelete}>
        <FiTrash2 aria-hidden="true" />Excluir
      </Button>
      {item.recurrenceId && item.isRecurrenceActive && <Button type="button" $variant="secondary" disabled={disabled}
        aria-label={`Encerrar recorrência de ${item.desc}`} onClick={() => onEndRecurrence(item.recurrenceId)}>
        <FiRepeat aria-hidden="true" />Encerrar recorrência
      </Button>}
    </C.Actions>
  </C.Row>;
}

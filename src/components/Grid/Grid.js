import React, { useState } from "react";
import { FiInbox } from "react-icons/fi";
import GridItem from "../Griditem/GridItem";
import ConfirmDelete from "../ConfirmDelete";
import TransactionFilters from "../TransactionFilters";
import { Button } from "../../styles/ui";
import { Hint } from "../../styles/ui";
import * as C from "./styles";

export default function Grid({ itens, onDelete, onEdit, onEndRecurrence, categories,
  filters, paging, onFilters, onPage, disabled, showEmpty }) {
  const [deleting, setDeleting] = useState(null);
  return <C.Panel aria-labelledby="transactions-title">
    <C.Header><div><h2 id="transactions-title" tabIndex={-1}>Transações recentes</h2>
      <Hint>Consulte, filtre e organize seus lançamentos.</Hint></div>
      <span aria-label={`${paging.totalItems} transações`}>{paging.totalItems} registros</span>
    </C.Header>
    <TransactionFilters filters={filters} categories={categories} disabled={disabled} onApply={onFilters} />
    {itens.length > 0 ? <>
      <C.Labels aria-hidden="true"><span>Descrição</span><span>Categoria</span><span>Data</span><span>Valor</span><span>Ações</span></C.Labels>
      <C.List aria-label="Transações financeiras">
        {itens.map(item => <GridItem key={item.id} item={item} disabled={disabled} onDelete={() => setDeleting(item)}
          onEdit={onEdit} onEndRecurrence={onEndRecurrence} />)}
      </C.List>
    </> : <C.Empty><FiInbox aria-hidden="true" />
      <h3>{showEmpty ? "Nenhuma transação cadastrada." : "Aguardando seus dados"}</h3>
      <p>{showEmpty ? "Adicione sua primeira entrada ou saída para começar a acompanhar seu saldo." : "A lista aparecerá quando a consulta for concluída."}</p>
    </C.Empty>}
    {paging.totalPages > 1 && <C.Pagination aria-label="Paginação de transações">
      <Button type="button" $variant="secondary" disabled={disabled || paging.page <= 1} onClick={() => onPage(paging.page - 1)}>Anterior</Button>
      <span>Página {paging.page} de {paging.totalPages}</span>
      <Button type="button" $variant="secondary" disabled={disabled || paging.page >= paging.totalPages} onClick={() => onPage(paging.page + 1)}>Próxima</Button>
    </C.Pagination>}
    {deleting && <ConfirmDelete item={deleting} onCancel={() => setDeleting(null)} onConfirm={onDelete} />}
  </C.Panel>;
}

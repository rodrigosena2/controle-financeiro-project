# Funcionalidades financeiras

> Contratos originalmente implementados na API ASP.NET Core. O runtime Firebase mantém
> os mesmos comportamentos por meio de `src/api.js` e das regras do Firestore; detalhes
> da migração estão em [FIREBASE.md](FIREBASE.md).

## Categorias

As categorias são um catálogo fixo fornecido por `GET /api/transactions/categories`.
Receitas aceitam `Salary`, `Freelance`, `Investments` e `OtherIncome`. Despesas
aceitam `Food`, `Housing`, `Transportation`, `Health`, `Education`, `Leisure`,
`Subscriptions` e `OtherExpense`. O React usa os rótulos em português devolvidos
pela API; o backend valida a compatibilidade entre tipo e categoria e persiste o
valor estável em inglês.

Lançamentos anteriores à migration recebem `OtherIncome` ou `OtherExpense` conforme
o tipo já persistido. Não há gerenciamento customizado de categorias nesta etapa.

## Consulta, resumo e paginação

`GET /api/transactions` aceita os parâmetros opcionais `from`, `to`, `type`,
`category`, `search`, `sortBy`, `sortDirection`, `page` e `pageSize`. Os filtros são
combinados no SQL e sempre incluem o usuário autenticado. `pageSize` aceita de 1 a
50; o padrão é 10. A ordenação padrão é data decrescente, com desempate por criação
e identificador.

A resposta contém `items`, `page`, `pageSize`, `totalItems` e `totalPages`. O resumo
do período vem de `GET /api/transactions/summary?from=...&to=...` e calcula receitas,
despesas e saldo no SQL sobre todas as páginas. O frontend oferece mês atual, mês
anterior e período personalizado.

## Recorrência simples

Ao criar uma transação, `recurrenceFrequency` pode ser `Weekly`, `Monthly` ou omitido.
A API cria a primeira ocorrência e uma série em `RecurringTransactions`. Antes de
consultas de lista/resumo, ocorrências vencidas são materializadas até a data atual.
O índice único `(RecurringTransactionId, Date)` impede que a mesma ocorrência seja
persistida duas vezes.

`POST /api/transactions/recurrences/{id}/end` encerra somente uma série pertencente
ao usuário autenticado. Ocorrências já criadas permanecem no histórico. Nesta etapa,
editar ou excluir um lançamento recorrente afeta somente a ocorrência selecionada;
não altera a regra da série nem as demais ocorrências. A interface deixa esse escopo
explícito. A regra mensal usa `DateOnly.AddMonths`, sem calendário de dias úteis ou
ajustes bancários.

## Migration

`20260917014011_AddFinancialFeatures` adiciona a categoria às transações existentes,
cria `RecurringTransactions`, a chave estrangeira opcional da ocorrência e os índices
de consulta/deduplicação. Para aplicar:

```powershell
$env:ASPNETCORE_ENVIRONMENT="Development"
dotnet ef database update --project backend/ControleFinanceiro.Api --startup-project backend/ControleFinanceiro.Api
```

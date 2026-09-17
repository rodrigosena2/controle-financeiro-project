# Validação das funcionalidades financeiras — 17/09/2026

> Registro da implementação SQL Server preservada. A suíte Firebase atual cobre os
> comportamentos equivalentes e o isolamento nas regras do Firestore.

## Escopo entregue

- categorias fixas compatíveis com receita/despesa;
- filtros combinados por período, tipo, categoria e descrição;
- resumo do período calculado no SQL Server;
- ordenação por data, valor ou descrição;
- paginação com metadados;
- recorrência semanal/mensal e encerramento da série;
- edição/exclusão limitadas à ocorrência selecionada;
- migration aplicada ao banco local de desenvolvimento.

Autenticação, cookies, CSRF e a obtenção do proprietário pela identidade autenticada
não foram refatorados. As novas rotas são autorizadas, usam a mesma proteção CSRF para
escritas e filtram `UserId` no serviço.

## Verificações

| Verificação | Resultado |
| --- | --- |
| `npm.cmd test -- --watchAll=false --runInBand` | 66 aprovados |
| `npm.cmd run lint` | aprovado, 0 erros/avisos do código |
| `npm.cmd run build` | aprovado |
| `npm.cmd run test:responsive` | 37 verificações aprovadas |
| `dotnet build ControleFinanceiro.slnx --no-restore` | aprovado, 0 erros/avisos |
| `dotnet test ControleFinanceiro.slnx --no-build` | 34 aprovados, 0 ignorados |
| `dotnet ef database update ...` | `AddFinancialFeatures` aplicada |

Os testes SQL criaram bancos aleatórios, aplicaram todas as migrations do zero e
removeram somente esses bancos temporários. A regressão cobre autenticação, sessão,
CSRF, isolamento A/B e CRUD anterior, além das novas regras. O roteiro responsivo foi
adaptado ao contrato paginado e executado em 360, 390, 430, 768 e 1440 px.

## Riscos conhecidos

- a recorrência é materializada quando lista/resumo são consultados; não há serviço em
  segundo plano ou notificação;
- recorrência mensal segue a semântica simples de `DateOnly.AddMonths`, sem calendário
  de dias úteis;
- o índice único impede duplicação de ocorrência. Em consultas simultâneas extremas,
  uma disputa de gravação ainda pode devolver conflito e exigir nova consulta;
- editar/excluir não oferece “todas as futuras” nesta etapa;
- a lista usa no máximo 50 itens por página; não há seleção de tamanho na interface;
- o teste físico em celular e certificado HTTPS de LAN continuam manuais.

# Regras para agentes de IA

## Objetivo do projeto

Evoluir o Controle Financeiro de forma incremental para uma aplicação full stack de portfólio, preservando um estado executável e demonstrável a cada entrega.

## Antes de alterar código

1. Leia `README.md` e os arquivos de `docs/`.
2. Inspecione `git status` e não descarte alterações existentes.
3. Execute os testes relacionados ao comportamento que será alterado.
4. Limite cada mudança à etapa solicitada; não antecipe autenticação, banco, redesign ou infraestrutura.

## Regras técnicas

- Use npm e `package-lock.json`; não adicione outro lockfile.
- Preserve o React existente até que uma migração explícita seja aprovada.
- Não altere contratos ou regras financeiras sem testes de regressão.
- Valores monetários futuros devem usar `decimal` no backend, nunca ponto flutuante.
- O tipo da transação deve ser explícito; não use o sinal do valor para distinguir entrada e saída.
- Segredos, tokens e connection strings nunca devem ser versionados.
- Dados Firebase devem ficar sob `users/{uid}` e ser protegidos por regras testadas no emulador.
- Nunca use o SDK Admin, conta de serviço ou credenciais administrativas no frontend.
- Valores monetários no Firestore usam centavos inteiros (`amountCents`).
- A implementação ASP.NET/SQL em `backend/` é histórica; não a remova sem uma etapa explícita.
- Prefira mudanças pequenas, revisáveis e acompanhadas de documentação.

## Qualidade obrigatória

Antes de concluir uma alteração no front-end, execute:

```powershell
npm test -- --watchAll=false
npm run lint
npm run build
npm run test:firebase
```

Quando houver backend, execute também build e testes da solução .NET. Não declare sucesso se alguma verificação obrigatória falhar; documente claramente o bloqueio.

Os testes de integração usam um banco SQL Server temporário e exigem uma instância acessível. Nunca aponte `CONTROLE_FINANCEIRO_TEST_SQL` para um banco que contenha dados importantes; o teste troca o catálogo por um nome aleatório e remove somente esse catálogo ao final.

## Estrutura planejada

A estrutura full stack está descrita em `docs/ARCHITECTURE.md`. Ela é uma direção evolutiva, não autorização para criar antecipadamente todos os projetos ou camadas.

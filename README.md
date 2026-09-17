# Controle Financeiro

Aplicação de controle financeiro para registrar entradas e saídas, acompanhar totais e
persistir lançamentos por conta no Cloud Firestore.

O frontend usa Firebase Authentication para cadastro, login, logout e restauração de
sessão. As regras do Firestore isolam os dados pelo UID autenticado. Consulte
[Firebase e publicação na Vercel](docs/FIREBASE.md) para configurar e publicar o sistema.

## Funcionalidades atuais

- Cadastro de entradas e saídas com descrição e valor.
- Cálculo do total de entradas, saídas e saldo.
- Edição e exclusão de lançamentos.
- Categorias compatíveis com receitas/despesas, filtros combinados e busca.
- Resumo mensal ou personalizado calculado sobre os dados do período, ordenação e paginação.
- Transações recorrentes semanais e mensais, com encerramento da série.
- Persistência no Cloud Firestore com regras de acesso por usuário.
- Layout mobile-first, acessível e adaptável para celular, tablet e desktop.
- Feedback visual consistente, validação associada aos campos e confirmação de exclusão.

## Tecnologias atuais

- React 18
- Create React App / react-scripts 5
- styled-components 5
- react-icons 4
- Jest e Testing Library
- Firebase Authentication
- Cloud Firestore e Emulator Suite

A implementação anterior em ASP.NET Core, Identity, Entity Framework e SQL Server foi
preservada em `backend/` e no histórico para referência de portfólio, mas não participa
do runtime Firebase.

O projeto usa `npm` como gerenciador de pacotes e mantém somente `package-lock.json` para instalações reproduzíveis.

## Executar

```powershell
npm.cmd install
npm.cmd start
```

Copie `.env.example` para `.env.local` e preencha a configuração do aplicativo Web do
Firebase antes de iniciar.

## Validação

```powershell
npm.cmd test -- --watchAll=false
npm.cmd run lint
npm.cmd run build
npm.cmd run test:firebase
npm.cmd run test:responsive
```

### Backend anterior

```powershell
dotnet tool restore
dotnet ef database update --project backend/ControleFinanceiro.Api --startup-project backend/ControleFinanceiro.Api
dotnet build ControleFinanceiro.slnx
dotnet test ControleFinanceiro.slnx
dotnet run --project backend/ControleFinanceiro.Api
```

Esses comandos validam a implementação .NET preservada, não o runtime Firebase atual.

## Documentação

- [Estado atual e diagnóstico](docs/CURRENT_STATE.md)
- [Arquitetura atual e planejada](docs/ARCHITECTURE.md)
- [Preparação do ambiente](docs/SETUP.md)
- [Resultado das validações](docs/VALIDATION.md)
- [Backend e banco de dados](docs/BACKEND.md)
- [Autenticação, segurança e execução completa](docs/AUTHENTICATION.md)
- [Integração React, persistência e rede local](docs/FRONTEND_INTEGRATION.md)
- [Regressão da integração em 16/09/2026](docs/INTEGRATION_VALIDATION.md)
- [Auditoria e melhoria de UX/UI](docs/UX_UI.md)
- [Categorias, filtros, resumo, paginação e recorrência](docs/FINANCIAL_FEATURES.md)
- [Validação desta etapa financeira](docs/FINANCIAL_VALIDATION.md)
- [Firebase, segurança, ambiente e Vercel](docs/FIREBASE.md)

## Estado atual

O Cloud Firestore é a fonte oficial do runtime atual. A importação de dados do SQL Server
ou do legado permanece desativada e nunca ocorre automaticamente. Recuperação de senha,
teste físico em celular e publicação final continuam como etapas futuras.

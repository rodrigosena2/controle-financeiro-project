# Controle Financeiro

Aplicação full stack para registrar entradas e saídas, acompanhar totais e persistir
os lançamentos por conta no SQL Server.

O frontend usa cadastro, login e logout com ASP.NET Core Identity. As transações vêm do SQL Server e pertencem exclusivamente à conta autenticada. Consulte [Autenticação e execução HTTPS](docs/AUTHENTICATION.md) para iniciar o sistema completo.

## Funcionalidades atuais

- Cadastro de entradas e saídas com descrição e valor.
- Cálculo do total de entradas, saídas e saldo.
- Edição e exclusão de lançamentos.
- Categorias compatíveis com receitas/despesas, filtros combinados e busca.
- Resumo mensal ou personalizado calculado pela API, ordenação e paginação.
- Transações recorrentes semanais e mensais, com encerramento da série.
- Persistência no SQL Server por usuário; cookie HttpOnly e proteção CSRF.
- Layout mobile-first, acessível e adaptável para celular, tablet e desktop.
- Feedback visual consistente, validação associada aos campos e confirmação de exclusão.

## Tecnologias atuais

- React 18
- Create React App / react-scripts 5
- styled-components 5
- react-icons 4
- Jest e Testing Library
- ASP.NET Core / .NET 10 LTS
- Entity Framework Core 10
- SQL Server
- Swagger/OpenAPI
- xUnit

O projeto usa `npm` como gerenciador de pacotes e mantém somente `package-lock.json` para instalações reproduzíveis.

## Executar

```powershell
npm.cmd install
npm.cmd run build
```

Para usar o sistema completo, configure o banco e o certificado HTTPS conforme [AUTHENTICATION.md](docs/AUTHENTICATION.md), depois execute `dotnet run --project backend/ControleFinanceiro.Api` e abra `https://localhost:7091`.

## Validação

```powershell
npm.cmd test -- --watchAll=false
npm.cmd run lint
npm.cmd run build
npm.cmd run test:responsive
```

### Backend

```powershell
dotnet tool restore
dotnet ef database update --project backend/ControleFinanceiro.Api --startup-project backend/ControleFinanceiro.Api
dotnet build ControleFinanceiro.slnx
dotnet test ControleFinanceiro.slnx
dotnet run --project backend/ControleFinanceiro.Api
```

Com a API em execução, a interface compilada fica em `https://localhost:7091` e o Swagger em `https://localhost:7091/swagger`. Execute `npm.cmd run build` antes e confie no certificado de desenvolvimento conforme a documentação de autenticação.

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

## Estado atual

O SQL Server continua sendo a fonte oficial. Categorias, filtros, resumo por período,
paginação e recorrência simples estão documentados separadamente. A importação do
legado permanece desativada; recuperação de senha por email, teste físico em celular
e deploy continuam como etapas futuras.

# Backend e banco de dados
> Atualização: os contratos de usuários/transações abaixo descrevem a etapa anterior. As rotas atuais, cookies, CSRF e comandos HTTPS estão em [AUTHENTICATION.md](AUTHENTICATION.md). As rotas provisórias foram removidas.

## Estrutura

O backend começa deliberadamente com dois projetos:

```text
backend/
├── ControleFinanceiro.Api/
│   ├── Controllers/       # contrato HTTP
│   ├── Data/              # DbContext, configurações e migrations
│   ├── Domain/            # entidades e invariantes
│   ├── Dtos/              # modelos de entrada e saída
│   ├── Errors/            # Problem Details e exceções conhecidas
│   └── Services/          # casos de uso de transações
└── ControleFinanceiro.Tests/
    ├── Domain/            # testes rápidos das regras
    └── Integration/       # API completa com SQL Server real
```

Não há projetos separados para cada camada. A organização por pastas mantém as responsabilidades claras e pode ser extraída no futuro se o domínio realmente crescer.

## Conexão segura

`appsettings.json` não contém credenciais. Para desenvolvimento nesta máquina, `appsettings.Development.json` usa autenticação integrada do Windows no SQL Server Express LocalDB. A instância `BARTENDER` detectada pertence a outro software e não deve receber bancos ou permissões do projeto.

Para outra instância ou para uma connection string com credenciais, use User Secrets:

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "SUA_CONNECTION_STRING" --project backend/ControleFinanceiro.Api
```

Em produção, defina a variável de ambiente `ConnectionStrings__DefaultConnection`. Nunca versione senhas.

## Banco e migrations

```powershell
dotnet tool restore
dotnet ef database update --project backend/ControleFinanceiro.Api --startup-project backend/ControleFinanceiro.Api
```

A migration `InitialCreate` cria:

- `Users`, com e-mail normalizado e índice único;
- `Transactions`, com chave estrangeira para usuário;
- `Amount` como `decimal(18,2)`;
- `Type` como texto (`Income` ou `Expense`);
- índice por `UserId` e `Date`.

## Endpoints

| Método | Rota | Finalidade |
| --- | --- | --- |
| POST | `/api/users` | Criar usuário provisório |
| GET | `/api/users/{id}` | Consultar usuário |
| GET | `/api/users/{userId}/transactions` | Listar transações do usuário |
| GET | `/api/users/{userId}/transactions/{id}` | Consultar transação |
| POST | `/api/users/{userId}/transactions` | Criar transação |
| PUT | `/api/users/{userId}/transactions/{id}` | Atualizar transação |
| DELETE | `/api/users/{userId}/transactions/{id}` | Excluir transação |

O `UserId` na rota é uma solução transitória antes da autenticação. Todas as buscas já filtram pelo usuário; na próxima etapa, o valor será obtido das claims do token e não será aceito do cliente.

## Swagger

```powershell
dotnet run --project backend/ControleFinanceiro.Api
```

Abra `http://localhost:5091/swagger`. O Swagger é habilitado somente no ambiente `Development`.

## Testes

```powershell
dotnet test ControleFinanceiro.slnx
```

Os testes de domínio validam criação, valor, descrição e tipos. O teste de integração cria um banco SQL Server com nome aleatório, aplica as migrations, percorre o CRUD pela API, consulta diretamente a persistência e remove apenas esse banco temporário ao terminar.

Para escolher outra instância de teste:

```powershell
$env:CONTROLE_FINANCEIRO_TEST_SQL = "Server=(localdb)\MSSQLLocalDB;Database=master;Trusted_Connection=True;Encrypt=False"
dotnet test ControleFinanceiro.slnx
```

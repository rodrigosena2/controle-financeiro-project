# Autenticação e isolamento de dados

## Decisão: Identity e cookies
O backend usa ASP.NET Core Identity com armazenamento EF Core no SQL Server.
Senhas são processadas pelo PasswordHasher nativo (hash com salt); não são registradas
em logs, retornadas pela API ou armazenadas em texto puro.

A aplicação React é servida pelo ASP.NET Core na mesma origem HTTPS.
Cookie de sessão: HttpOnly, Secure, SameSite=Strict, sem Domain e sem persistência
no navegador. Prazo absoluto de 30 minutos, sem renovação automática.
O código JavaScript nunca recebe o cookie como dado nem o armazena em localStorage.
Isso evita a necessidade de gerenciar access tokens e refresh tokens no navegador.

Como cookies são enviados automaticamente, todas as operações de escrita
(inclusive cadastro, login e logout) exigem o cabeçalho X-CSRF-TOKEN, obtido
em GET /api/auth/csrf. O cliente busca um token antes de cada escrita;
a verificação permanece ativa nos testes. As respostas financeiras e de sessão
usam Cache-Control: no-store.

Referências:
- [Antiforgery no ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/anti-request-forgery?view=aspnetcore-10.0)
- [Cookies e SameSite](https://learn.microsoft.com/en-us/aspnet/core/security/samesite?view=aspnetcore-10.0)

## Contratos atuais
| Método | Rota | Comportamento |
| --- | --- | --- |
| GET | /api/auth/csrf | Fornece token CSRF associado ao navegador |
| POST | /api/auth/register | Cria conta com email, displayName e password; 201 ou 400 |
| POST | /api/auth/login | Verifica credenciais e estabelece cookie; 200 ou 401 |
| GET | /api/auth/me | Retorna somente a conta autenticada; 200 ou 401 |
| POST | /api/auth/logout | Revoga sessões da conta e expira o cookie; 204 |
| GET/POST | /api/transactions | Lista paginada/cria registros da identidade autenticada |
| GET/PUT/DELETE | /api/transactions/{id} | Consulta/altera/exclui registro da identidade autenticada |
| GET | /api/transactions/summary | Resume receitas, despesas e saldo do período autenticado |
| GET | /api/transactions/categories | Fornece o catálogo fixo de categorias |
| POST | /api/transactions/recurrences/{id}/end | Encerra uma recorrência da identidade autenticada |

As rotas antigas /api/users e /api/users/{userId}/transactions foram removidas.
Nenhum UserId recebido na URL, query string ou corpo determina a propriedade.
O controller extrai o identificador da claim NameIdentifier emitida pelo Identity.
O serviço aplica UserId em toda consulta e cruza UserId com Id nas operações individuais.
Registros de terceiros respondem 404, inclusive em PUT/DELETE, sem revelar sua existência.

## Credenciais e sessões
- Email validado, normalizado e único no Identity e no banco.
- Senha: 12 a 128 caracteres; exige maiúscula, minúscula, número e símbolo.
- Após 5 falhas, a conta fica bloqueada por 15 minutos.
- Login e cadastro limitados a 20 solicitações por minuto por IP, por processo.
- Login inválido, conta inexistente e conta bloqueada retornam a mesma mensagem.
- Security stamp verificado em cada requisição, sem renovar o prazo do cookie.
- Logout atualiza o security stamp: também invalida cookies copiados e outras sessões
  da mesma conta. Logout em todos os dispositivos é uma decisão explícita desta versão.

## Iniciar localmente
Na raiz do repositório, execute cada comando separadamente em PowerShell:

```powershell
dotnet dev-certs https --trust
```

```powershell
$env:ASPNETCORE_ENVIRONMENT="Development"
```

```powershell
dotnet tool restore
```

```powershell
dotnet ef database update --project backend/ControleFinanceiro.Api
```

```powershell
npm.cmd run build
```

```powershell
dotnet run --project backend/ControleFinanceiro.Api
```

Abra https://localhost:7091 para usar a interface compilada e
https://localhost:7091/swagger para consultar a API.
O nome do perfil de inicialização permanece "http", mas sua URL agora usa HTTPS.
Durante o desenvolvimento, `npm.cmd start` encaminha `/api` para
`https://localhost:7091`; por isso a API também precisa estar em execução. O proxy é
apenas de desenvolvimento e mantém as chamadas do navegador na mesma origem.
Após mudar o React para uso pela porta 7091, execute npm.cmd run build novamente.

## Dados anteriores
A migration AddIdentity acrescenta as estruturas de autenticação sem apagar
Users ou Transactions existentes. Contas provisórias anteriores não tinham senha:
permanecem preservadas, mas não podem entrar até um processo administrativo ou
de recuperação verificada atribuir credenciais. Não há senha padrão ou
possibilidade de reivindicar uma conta antiga apenas informando seu email.

Os lançamentos antigos do localStorage não têm proprietário autenticado.
Permanecem fora da lista e nunca são importados automaticamente. A integração revisada
em 16/09/2026 desativa a importação porque uma resposta perdida após o commit poderia
duplicar lançamentos na próxima tentativa. Os registros locais são preservados intactos;
somente dados devolvidos pela API entram na lista da conta atual. A retomada da importação
depende de deduplicação no servidor e confirmação explícita.

## Recuperação de senha futura
Os provedores nativos de token do Identity, security stamp e tabelas de tokens
estão configurados. A próxima etapa poderá usar GeneratePasswordResetTokenAsync
e ResetPasswordAsync após verificar o email. Ainda não há endpoints de recuperação,
envio de email ou confirmação de endereço. O sistema não deve prometer que envia
mensagens até o serviço de email estar implementado.

## Operação em produção
HTTPS é obrigatório. Hospede UI e API na mesma origem; não há CORS permissivo.
Configure a connection string por variável de ambiente/secret store.
Preserve e proteja as chaves do ASP.NET Core Data Protection; em múltiplas instâncias,
compartilhe o key ring protegido e implemente limite de requisições distribuído.
Não versione chaves. O host de testes usa chaves efêmeras apenas para isolamento.

## Validação
```powershell
dotnet build
dotnet test
```

Os testes HTTP sem banco verificam: ausência de sessão nos métodos financeiros,
cookie adulterado e expirado, duração absoluta, HttpOnly/Secure, CSRF e dados
de cadastro inválidos. Os testes de domínio anteriores continuam presentes.

Os testes SQL Server criam bancos aleatórios com migrations e usam cookies reais
emitidos pelo Identity: duas contas, CRUD, tentativa de trocar UserId no corpo/query,
rotas antigas, consulta/alteração/exclusão cruzadas, lista isolada, logout e novo login,
hash da senha, cadastro duplicado, credenciais incorretas, usuário inexistente,
bloqueio e replay de cookie revogado. A limpeza exclui somente o banco aleatório do teste.

### Correção da validação monetária
O log enviado pelo usuário confirmou aplicação de AddIdentity e uma falha no CRUD:
RangeAttribute interpretava os limites decimais com a cultura do Windows, causando
erro 500 em pt-BR. Os DTOs de criação e atualização agora usam
ParseLimitsInInvariantCulture. Dois testes de regressão cobrem pt-BR/en-US,
valores válidos e limites inválidos; o cenário pt-BR reproduziu o erro antes da correção.
Validação final da integração em 08/09/2026: build aprovado sem avisos e os 22 testes
.NET aprovados no contexto Windows com LocalDB, incluindo autenticação, expiração,
CSRF, CRUD e isolamento. A suíte React possui 14 testes aprovados; lint e build de
produção também foram aprovados.

Em 16/09/2026, a regressão .NET voltou a aprovar os 22 testes em SQL Server real.
O teste de persistência também verifica novo cliente HTTP independente. Foram aprovados
54 testes frontend. Identity, cookies, CSRF, expiração e filtros do backend não sofreram
alterações nesta revisão; detalhes em [INTEGRATION_VALIDATION.md](INTEGRATION_VALIDATION.md).

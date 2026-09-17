# Integração e estabilidade — 16/09/2026

> Registro histórico da versão React + ASP.NET Core. A validação Firebase atual está em
> `firebase-tests/` e em `docs/FIREBASE.md`.

## Escopo e resultado

Foram aproveitados o CRUD React/API e todos os contratos já existentes. A revisão
tratou falhas de carregamento, erros HTTP, concorrência de ações na interface e legado.
Nenhum arquivo de implementação da API, Identity, cookies, CSRF, autorização, modelo
EF ou migration foi alterado nesta etapa. No backend, somente o teste de integração
ganhou uma verificação de persistência por outro cliente HTTP.

O SQL Server continua sendo a fonte oficial. As telas recebem dados por GET; POST,
PUT e DELETE persistem pelo serviço existente e recarregam a lista confirmada.
Nenhuma transação nova é armazenada em localStorage ou em cookies próprios.

## Problemas encontrados e decisões

1. Erros 401/403/404 sem corpo recebiam mensagem genérica, e erros de validação por
   campo não apareciam. O cliente central agora interpreta status/Problem Details,
   protege detalhes internos de erros 500 e distingue falha de rede/resposta inválida.
2. O fluxo podia anunciar sucesso depois de falhar ao recarregar a lista. A gravação
   confirmada é distinguida do GET posterior: a tela informa a falha e permite
   recarregar, sem sugerir reenvio de um lançamento já salvo.
3. Cliques concorrentes e respostas atrasadas podiam alterar estado após logout.
   Ações são bloqueadas enquanto pendentes e leituras antigas são descartadas.
   Trocar de conta também descarta o rascunho financeiro anterior.
4. A importação não era idempotente: perder a resposta após o commit ou importar
   em duas abas podia duplicar registros. A opção foi desativada e os dados antigos
   foram preservados. Não se implementou migração nesta revisão; sua retomada exige
   deduplicação no servidor e confirmação explícita.
5. A URL foi isolada em configuração por ambiente com /api relativo por padrão.
   A mesma compilação acompanha localhost, IPv4 ou domínio sob a mesma origem HTTPS.

## Arquivos desta revisão

Criados:

- src/config.js — resolução da URL-base e verificação de mesma origem.
- src/config.test.js — configuração localhost/IPv4/produção.
- docs/INTEGRATION_VALIDATION.md — esta entrega.

Alterados:

- src/api.js — erros HTTP/validação, timeout, cookies e CSRF centralizados.
- src/api.test.js — contratos, CSRF, falhas de rede e respostas inválidas.
- src/App.js — estados de sessão/dados, recuperação, ações pendentes e leitura do legado.
- src/App.test.js — regressões dos fluxos e casos de falha/concorrência.
- src/components/Form/Form.js — formulário acessível, estados pendentes e validação básica.
- src/legacyTransactions.js — aviso somente de leitura, sem envio ou remoção de legado.
- backend/ControleFinanceiro.Tests/Integration/TransactionsApiTests.cs — outro cliente
  autenticado recupera o registro persistido e observa sua exclusão.
- .env.example — configuração pública e independente do host.
- README.md, docs/SETUP.md, docs/AUTHENTICATION.md, docs/FRONTEND_INTEGRATION.md —
  comandos, estado atual, importação desativada e instruções HTTPS/LAN.

As outras alterações já existentes na árvore de trabalho foram preservadas.

## Testes executados

| Comando | Resultado |
| --- | --- |
| npm.cmd test -- --watchAll=false --runInBand | 54 aprovados; 3 suítes |
| npm.cmd run lint | aprovado; nenhum erro/aviso ESLint |
| npm.cmd run build | aprovado |
| dotnet build ControleFinanceiro.slnx --no-restore | aprovado; 0 avisos/erros |
| dotnet test ControleFinanceiro.slnx --no-restore --logger "console;verbosity=quiet" | 22 aprovados; nenhum ignorado |

O teste .NET foi executado no contexto Windows autorizado com acesso ao LocalDB.
Os dois cenários SQL aplicaram migrations em bancos de nomes aleatórios e removeram
somente esses bancos ao terminar. Nenhum banco persistente do usuário foi apagado.

Cobertura frontend (Jest/Testing Library, API simulada):

- cadastro, login, restauração, logout e novo login;
- entrada, saída, edição, exclusão, totais e saldo negativo;
- nova montagem da página recuperando os registros devolvidos pela API;
- erros de validação, 401, 403, 404, 500, API indisponível e timeout;
- CSRF novo antes de cada escrita e após login; falha de CSRF impede a mutação;
- sucesso de escrita seguido de falha do GET, sem reenviar o POST;
- clique repetido, resposta antiga após logout e troca de conta;
- legado preservado e armazenamento do navegador bloqueado;
- configuração relativa para localhost, IPv4 e domínio.

Regressão backend (ASP.NET Core + SQL Server real):

- regras de entidade e validação monetária pt-BR/en-US;
- cadastro duplicado, credenciais inválidas e bloqueio;
- sessão inválida/expirada/revogada, cookies seguros, CSRF e endpoints sem login;
- User A e User B: isolamento de listagem, leitura, atualização e exclusão;
- tentativas de trocar UserId, persistência, edição, logout/login e exclusão;
- cliente HTTP independente faz login na mesma conta, lê o registro salvo e observa
  a exclusão. Isso testa sessão/persistência compartilhada, não um aparelho físico.

Conferência adicional com o build servido pelo Kestrel:

```powershell
dotnet run --no-build --project backend/ControleFinanceiro.Api -- --urls https://localhost:7191
```

GET / respondeu 200 (React); GET /api/auth/me e /api/transactions responderam 401 sem
login; GET /api/auth/csrf respondeu 200. O servidor temporário foi encerrado ao terminar.
O diagnóstico HTTP ignorou somente a confiança do certificado local de desenvolvimento;
isso não comprova confiança TLS em navegadores ou celulares.

## Pendências e limites

- Nenhum teste automatizado obrigatório ficou pendente ou ignorado.
- Não foi executado um teste ponta a ponta em navegador real ou celular físico;
  a UI foi testada em DOM simulado e a API em HTTP/SQL real.
- O certificado de desenvolvimento ainda foi reportado como não confiável pelo
  Kestrel. Para localhost, execute `dotnet dev-certs https --trust`.
- Para celular, ainda é necessário certificado válido/confiável para o IPv4/nome,
  configuração do Kestrel e porta permitida na rede privada. O passo a passo está em
  [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md). Nenhum firewall foi alterado.
- Importação permanece indisponível até haver deduplicação no servidor. Dados locais
  não foram apagados nem migrados.
- O CRUD não possui chave de idempotência. Em resposta de escrita perdida, a interface
  exige consulta antes de nova tentativa e não realiza reenvio automático.
- Valores extremos ainda excedem a precisão de Number no frontend. O backend permanece
  decimal; a evolução do contrato monetário está registrada como débito técnico.
- O build mantém avisos das dependências CRA/Node e da base caniuse-lite. Não foram
  atualizadas dependências nem migrado o bundler nesta etapa.

Para repetir a suíte SQL em outro ambiente com banco disponível:

```powershell
dotnet build ControleFinanceiro.slnx
dotnet test ControleFinanceiro.slnx
```

O padrão de teste usa (localdb)\MSSQLLocalDB. Para outra instância, configure
CONTROLE_FINANCEIRO_TEST_SQL conforme docs/BACKEND.md; a conta de teste precisa criar
e excluir bancos temporários. Não ocorreu deploy ou avanço para outra etapa.

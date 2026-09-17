# Integração React e API

## Fonte oficial dos dados

O SQL Server, acessado exclusivamente pela API, é a fonte oficial das transações.
O React recupera a sessão em `GET /api/auth/me` e, quando autenticado, consulta
`GET /api/transactions`. Criar, editar e excluir sempre chama a API e depois
recarrega a lista do servidor. Reabrir ou atualizar a página não depende do estado
em memória nem do `localStorage`.

`src/config.js` resolve a URL-base por ambiente; `src/api.js` concentra
envio de cookies, obtenção do token CSRF,
serialização JSON, leitura de Problem Details e erro de indisponibilidade. Componentes
React não contêm endereços da API. O padrão `/api` mantém frontend e backend na mesma
origem, necessário para a estratégia de cookies já aprovada.

## Contratos reutilizados

| Operação | Método e rota | Corpo relevante |
| --- | --- | --- |
| Recuperar sessão | `GET /api/auth/me` | — |
| Cadastro | `POST /api/auth/register` | `email`, `displayName`, `password` |
| Login | `POST /api/auth/login` | `email`, `password` |
| Logout | `POST /api/auth/logout` | — |
| Listar | `GET /api/transactions` | filtros, ordenação, página e metadados |
| Resumir | `GET /api/transactions/summary` | `from`, `to` |
| Categorias | `GET /api/transactions/categories` | — |
| Criar | `POST /api/transactions` | `description`, `amount`, `type`, `category`, `date`, recorrência opcional |
| Editar | `PUT /api/transactions/{id}` | `description`, `amount`, `type`, `category`, `date` |
| Excluir | `DELETE /api/transactions/{id}` | — |
| Encerrar recorrência | `POST /api/transactions/recurrences/{id}/end` | — |

Antes de cada `POST`, `PUT` ou `DELETE`, o cliente obtém um token em
`GET /api/auth/csrf` e o envia no cabeçalho `X-CSRF-TOKEN`. Todas as chamadas usam
`credentials: include`; senhas, cookies e tokens não são gravados em armazenamento web.

## Legado preservado; importação desativada

O `localStorage` não alimenta a lista financeira. Após autenticação, uma leitura
opcional da chave histórica `transactions` serve apenas para mostrar um aviso.
Não há gravação, exclusão ou envio desses registros. JSON inválido ou armazenamento
bloqueado não impedem usar os dados da API.

A importação anterior enviava POST e removia o item local depois da resposta. Se o
SQL confirmasse a gravação e a resposta se perdesse, repetir o POST criaria uma duplicata.
Duas abas também podiam enviar o mesmo registro. Portanto, aquela implementação não
garantia deduplicação; foi desativada, preservando os dados antigos.

A migração é opcional nesta etapa. Para retomá-la será necessário identificar cada
registro de importação e rejeitar repetições atomicamente no servidor, sempre após
autenticação e confirmação explícita. Não foi criada uma migration ou alterado o CRUD
apenas para viabilizar essa funcionalidade opcional.

## Configuração por ambiente

`REACT_APP_API_BASE_URL` é opcional e avaliada no build. Veja `.env.example`. Para a
configuração recomendada — aplicação compilada servida pelo ASP.NET Core — mantenha
`/api`. Essa URL acompanha a origem de quem abriu a página: localhost, IPv4 ou domínio.
Configurações de outra origem são recusadas antes de enviar credenciais. Em produção,
publique UI e API na mesma origem HTTPS, diretamente ou por proxy. Nenhuma política
CORS, cookie ou autenticação foi modificada.

### Mesmo computador

Para trabalhar com atualização automática do React, inicie a API e, em outro terminal,
o servidor de desenvolvimento. O proxy configurado em `src/setupProxy.js` encaminha apenas
as chamadas `/api` para o HTTPS do ASP.NET Core:

```powershell
dotnet run --project backend/ControleFinanceiro.Api
npm.cmd start
```

Abra `http://localhost:3000`. Sem a API na porta 7091, a interface apresentará erro de
conexão. Para validar exatamente o pacote que será publicado, use o fluxo abaixo:
O destino pode ser substituído em desenvolvimento com
`CONTROLE_FINANCEIRO_API_PROXY`, sem expor esse valor ao código do navegador.

O proxy corrige um caso específico do Create React App: sem encaminhamento, o pedido
`GET /api/auth/me` feito pela tela em `localhost:3000` recebia `200 text/html` com o
próprio `index.html`. O cliente esperava JSON e, corretamente, informava “A API retornou
uma resposta inválida”. Com o proxy, a mesma chamada chega à API e retorna `401` sem
sessão ou `200 application/json` com uma sessão válida.

### Diagnóstico de 504 no ambiente local

`npm.cmd start` inicia somente o React; ele não inicia o processo .NET. Se a API não
estiver ouvindo em `https://localhost:7091`, `GET /api/auth/me` recebe `504` do proxy,
com o corpo `Error occurred while trying to proxy`, e a interface apresenta a mensagem
genérica de falha do servidor. Nesse caso não há exception no backend, porque nenhuma
requisição chegou a ele.

Confirme que os dois terminais continuam abertos. A saída do primeiro deve conter
`Now listening on: https://localhost:7091` antes de abrir `http://localhost:3000`:

```powershell
dotnet run --project backend/ControleFinanceiro.Api
```

```powershell
npm.cmd start
```

Para verificar a porta no PowerShell:

```powershell
Test-NetConnection localhost -Port 7091
```

```powershell
npm.cmd run build
dotnet run --project backend/ControleFinanceiro.Api
```

Abra `https://localhost:7091`.

### Rede local

Cookies `Secure` exigem HTTPS. O certificado de desenvolvimento para `localhost` não é
adequado ao IPv4 de outro dispositivo. Para acesso real pela LAN:

O proxy de `npm.cmd start` resolve o desenvolvimento no próprio computador. Ele não
torna `http://IP-DO-PC:3000` adequado para login no celular: em HTTP por IPv4, o
navegador rejeita os cookies `Secure`. Para autenticação pela rede, use a aplicação
compilada servida pelo ASP.NET Core em HTTPS, conforme os passos abaixo.

1. Use um nome local ou o IPv4 do PC e um certificado confiável nesse dispositivo,
   contendo esse nome/IP no SAN.
2. Configure o certificado HTTPS do Kestrel e escute na interface da rede.
3. Libere somente a porta HTTPS escolhida no Firewall do Windows para a rede privada.
4. Abra `https://NOME-OU-IP:7091`; o frontend continuará chamando `/api` na mesma origem.

Não reduza o cookie para HTTP nem adicione CORS permissivo para contornar certificados.
Em produção, certificado público, DNS e proxy HTTPS substituem essa configuração local.

Exemplo PowerShell após obter um PFX confiável para o IPv4/nome usado pelo celular
(substitua o caminho; configure a senha por User Secrets, sem versioná-la):

```powershell
dotnet user-secrets set "Kestrel:Certificates:Default:Path" "C:\certificados\controle-financeiro-lan.pfx" --project backend/ControleFinanceiro.Api
```

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet run --project backend/ControleFinanceiro.Api --no-launch-profile -- --urls "https://0.0.0.0:7091"
```

`--no-launch-profile` evita que o perfil restrito a localhost substitua a configuração
de execução. O certificado deve ser confiável no celular também. Para produzir o build,
use `npm.cmd run build`; não é necessário colocar o IP em componentes ou alterar cookies.
A configuração de portas/certificados segue a [documentação do Kestrel](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/kestrel/endpoints?view=aspnetcore-10.0).
Nesta sessão, não foram instalados certificados LAN nem alterado o firewall.

## Estados tratados

- carregamento inicial da sessão e dos dados;
- conta sem transações;
- confirmação de cadastro/login e de mutações;
- Problem Details, incluindo mensagens por campo de validação e respostas 401/403/404/500;
- servidor indisponível e timeout de 15 segundos;
- sessão expirada, com remoção imediata dos dados privados da tela;
- gravação confirmada seguida de falha na consulta, sem apresentar sucesso completo;
- resultado de gravação incerto: nenhuma repetição automática; solicitar atualização;
- requisições antigas são descartadas após logout ou troca de conta;
- recuperação após falha por meio de Atualizar dados.

Falhas de rede não encerram uma sessão validada. As operações financeiras ficam
bloqueadas até recarregar uma lista válida; HTTP 401 limpa os dados privados e pede login.
Consultas periódicas preservam o formulário em edição e não concorrem com gravações.
Na troca de conta, rascunhos e dados anteriores são descartados. O backend continua
sendo a autoridade para propriedade e validação de transações.

## Débitos técnicos

- Create React App/react-scripts está obsoleto; migrar o bundler deve ser uma etapa própria.
- O resumo monetário usa centavos inteiros no navegador para apresentação; regras de
  validade e propriedade continuam no backend. Valores extremos do decimal(18,2)
  ultrapassam a precisão segura de Number no JSON/JavaScript; um contrato decimal
  textual ou um resumo calculado no servidor deve ser tratado em etapa específica.
- POSTs não têm chave de idempotência: uma resposta perdida exige consultar os dados
  antes de tentar de novo. A importação permanece desativada por esse motivo.
- A configuração de certificado/DNS da LAN depende do ambiente e não deve ser versionada
  com chaves privadas.

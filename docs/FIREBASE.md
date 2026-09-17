# Firebase e publicação na Vercel

## Decisão

O runtime principal usa React, Firebase Authentication e Cloud Firestore. A API
ASP.NET Core e o SQL Server permanecem no repositório como fotografia da implementação
anterior, no commit `99c95f3`, mas não são necessários para executar ou publicar a
aplicação Firebase.

```text
React na Vercel
├── Firebase Authentication (e-mail e senha)
└── Cloud Firestore
    └── users/{uid}/transactions e users/{uid}/recurrences
```

O SDK do Firebase mantém a sessão do navegador. A aplicação não grava ID token,
refresh token ou senha manualmente no `localStorage`. Como não há autenticação por
cookie da aplicação, o fluxo Firebase não usa o antigo token CSRF.

## Configuração local

Copie `.env.example` para `.env.local` e preencha os valores do aplicativo Web criado
no console Firebase. `.env.local` é ignorado pelo Git.

```powershell
npm.cmd install
npm.cmd start
```

Analytics não é inicializado nesta etapa. O `measurementId` pode permanecer configurado,
mas não é usado pelo bundle.

## Configuração no console Firebase

1. Em **Authentication > Sign-in method**, habilite **E-mail/senha**.
2. Em **Authentication > Settings > Password policy**, configure no mínimo 12 caracteres,
   maiúscula, minúscula, número e símbolo. A interface faz a mesma validação para dar
   feedback imediato, mas a política do serviço é a proteção definitiva.
3. Em **Firestore Database**, crie um banco Standard em modo de produção.
4. Em **Authentication > Settings > Authorized domains**, adicione o domínio final da
   Vercel, por exemplo `controle-financeiro.vercel.app`. Cada domínio de preview que
   executar login também precisa ser autorizado.

## Modelo e segurança

Valores monetários são persistidos em `amountCents`, um inteiro, evitando arredondamento
binário. Datas financeiras usam `yyyy-MM-dd`, preservando a data civil escolhida.

Os documentos ficam sob o UID autenticado:

```text
users/{uid}/transactions/{transactionId}
users/{uid}/recurrences/{recurrenceId}
```

`firestore.rules` exige que o UID do token corresponda ao UID do caminho e ao `userId`
do documento. As regras também validam campos permitidos, valor, descrição, tipo,
categoria, data e campos imutáveis. Não existe regra ampla de leitura ou escrita.

Ocorrências recorrentes são materializadas quando a conta consulta seus dados. A
atualização da próxima ocorrência usa uma transação atômica e IDs determinísticos
(`recurrenceId_yyyymmdd`), impedindo duplicações entre dispositivos. Editar ou excluir
uma ocorrência afeta somente aquela ocorrência; encerrar a série impede novas criações.

Filtros combinados, ordenação, paginação e resumo são aplicados sobre as transações do
período carregado. Isso evita a grande quantidade de índices compostos que seria exigida
por todas as combinações, mas pode aumentar leituras em períodos com muitos registros.
É um débito técnico consciente para o tamanho atual do produto.

## Testar regras localmente

O Firebase CLI atual exige JDK 21 ou superior.

```powershell
$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
$env:Path="$env:JAVA_HOME\bin;$env:Path"
npm.cmd run test:firebase
```

A suíte valida que User A acessa seu registro e que User B não consegue consultar,
alterar ou excluir esse registro. Também testa usuário anônimo, propriedade forjada,
campos inesperados, valor, categoria e imutabilidade.

## Publicar regras

Faça login com a conta proprietária do projeto e publique somente regras e índices:

```powershell
npx.cmd firebase-tools@15.30.1 login
npx.cmd firebase-tools@15.30.1 deploy --only firestore --project controle-financeiro-65dac
```

Revise o projeto mostrado pelo CLI antes de confirmar. Nunca use ou versione uma chave
de conta de serviço para este fluxo.

## Publicar na Vercel

Importe o repositório GitHub e use:

| Configuração | Valor |
| --- | --- |
| Framework | Create React App |
| Root Directory | `./` |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `build` |

Em **Settings > Environment Variables**, cadastre todas as variáveis
`REACT_APP_FIREBASE_*` de `.env.example` para Production e, quando necessário, Preview.
Essas variáveis são incorporadas no build; uma alteração exige novo deployment.

Depois do primeiro deployment, copie o domínio `.vercel.app`, autorize-o no Firebase
Authentication e faça um redeploy. Valide cadastro, login, refresh, CRUD, recorrência,
logout e isolamento com duas contas.

## Migração de dados

Dados existentes no SQL Server ou no armazenamento legado não são importados
automaticamente. Uma eventual importação deve ser explícita, autenticada, idempotente e
validada separadamente. Até essa ferramenta existir, os bancos permanecem independentes.

## Mudanças de comportamento conhecidas

- Logout encerra a sessão deste navegador. Revogação global de todas as sessões exigiria
  um ambiente administrativo confiável, que não faz parte do plano gratuito adotado.
- A política efetiva de senha precisa ser confirmada no console Firebase.
- Materialização de recorrências depende de uma abertura/consulta da aplicação; não há
  agendador em segundo plano no plano atual.

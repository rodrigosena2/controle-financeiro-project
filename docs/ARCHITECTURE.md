# Arquitetura

## Runtime atual

```text
React na Vercel
├── Firebase Authentication
└── Cloud Firestore
    ├── users/{uid}/transactions
    └── users/{uid}/recurrences
```

O React continua organizado como um único aplicativo Create React App. A camada
`src/api.js` concentra o acesso ao Firebase e preserva contratos simples para a tela;
os componentes não conhecem a configuração do projeto nem caminhos do Firestore.

Firebase Authentication mantém a sessão do navegador. O SDK administra seus tokens e a
aplicação não os grava manualmente no `localStorage`. O Firestore é a fonte oficial das
transações no runtime atual. A autorização é feita por `firestore.rules`, que exige que
o UID autenticado corresponda ao UID do caminho e ao proprietário do documento.

Valores financeiros são persistidos em centavos inteiros (`amountCents`). A interface
converte para reais somente na entrada e na apresentação. Datas financeiras usam
`yyyy-MM-dd` para não sofrerem deslocamento de fuso horário.

Filtros combinados, ordenação, paginação e resumo são feitos pela camada de acesso após
carregar os registros do período. A consulta usa o período no Firestore e os filtros
restantes em memória, evitando uma matriz extensa de índices compostos no estágio atual.

Recorrências ficam em uma coleção separada. A próxima ocorrência é avançada em uma
transação atômica e cada lançamento usa um ID determinístico; assim dois dispositivos
não criam a mesma ocorrência duas vezes. A materialização acontece quando o usuário
consulta os dados, sem agendador externo.

## Implementação anterior preservada

```text
React → ASP.NET Core API → Identity/EF Core → SQL Server
```

O projeto ASP.NET Core, migrations, testes e documentação anteriores continuam em
`backend/` para referência e histórico de portfólio. Eles não são chamados pelo
frontend Firebase e não devem ser alterados ou removidos sem uma etapa explícita.

O commit `99c95f3` contém a última versão funcional dessa implementação anterior.

## Testes e regras

- Jest/Testing Library testam componentes e a camada Firebase com dependências simuladas.
- O roteiro Playwright testa responsividade e fluxos da tela com um adaptador disponível
  somente em `localhost`.
- `firebase-tests/` executa as regras reais no Firestore Emulator, incluindo isolamento
  User A/User B, usuário anônimo, validação e imutabilidade.
- A suíte .NET permanece como regressão da implementação histórica e exige SQL Server
  ou LocalDB disponível.

## Configuração

As variáveis `REACT_APP_FIREBASE_*` são públicas e necessárias no build. `.env.local` é
ignorado. O Vercel deve receber as mesmas variáveis para Preview e Production; não há
connection string ou conta de serviço no frontend.

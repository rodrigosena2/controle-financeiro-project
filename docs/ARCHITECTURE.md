# Arquitetura
> Atualização: React e API agora compartilham HTTPS e usam ASP.NET Core Identity. Consulte [AUTHENTICATION.md](AUTHENTICATION.md) para contratos e isolamento atuais.

## Arquitetura anterior

Na versão inicial, o navegador concentrava interface, regras de cálculo e persistência:

```text
React → estado do App → localStorage
          ↓
   resumo e tabela
```

Essa limitação foi removida pela integração com a API e o SQL Server.

## Arquitetura implementada nesta etapa

```text
controle-financeiro-project/
├── src/                            # aplicação React atual
├── backend/
│   ├── ControleFinanceiro.Api/     # HTTP, domínio, serviços e EF Core
│   └── ControleFinanceiro.Tests/   # domínio e integração
├── docs/
└── README.md
```

```text
React → ASP.NET Core API → regras de negócio → SQL Server
             ↓
      identidade do usuário
```

As consultas financeiras agora são filtradas, ordenadas e paginadas no serviço. O
resumo é agregado pelo banco e não depende da página visível. Séries recorrentes ficam
em `RecurringTransactions`; cada lançamento materializado continua em `Transactions`,
preservando o histórico e o isolamento por usuário. Consulte
[FINANCIAL_FEATURES.md](FINANCIAL_FEATURES.md).

O frontend não foi movido nesta etapa para evitar uma alteração estrutural sem benefício funcional. A API permanece em um único projeto organizado por responsabilidade, adequada ao tamanho atual.

## Decisões

- **Monorepositório:** facilita versionar contratos, documentação e mudanças coordenadas.
- **Migração incremental:** o SQL Server é a fonte oficial; dados antigos do `localStorage`
  só podem ser importados após confirmação explícita.
- **API ASP.NET Core:** combina com o objetivo de portfólio em C# e fornece suporte maduro a validação e identidade.
- **SQL Server:** alinhado ao ecossistema .NET e ao objetivo profissional do projeto.
- **Testes em duas camadas:** interface e cliente HTTP no React; regras e integração HTTP/SQL no backend.
- **Sem infraestrutura antecipada:** autenticação, containers e deploy serão introduzidos apenas nas etapas correspondentes.

## Próximas etapas possíveis

Categorias, orçamento, recorrência, relatórios, automação de entrega e deploy devem ser
tratados em etapas independentes. Consulte [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)
para o fluxo atual e seus débitos técnicos.

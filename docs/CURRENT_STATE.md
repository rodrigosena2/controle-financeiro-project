# Estado atual
> Fotografia histórica do frontend anterior à autenticação. O estado atual está em [AUTHENTICATION.md](AUTHENTICATION.md).

## Visão geral

O projeto é uma aplicação de página única criada com Create React App. Não há roteamento, serviço HTTP, backend ou banco remoto. Todos os dados pertencem ao navegador atual.

## Dependências e ambiente

- React e React DOM 18.2.
- react-scripts 5.0.1 para desenvolvimento, build, ESLint e Jest.
- styled-components 5.3 para estilos isolados por componente.
- react-icons 4.7 para ícones.
- Testing Library para testes de interface.
- Node.js LTS 24.19.0 e npm 11.17.0 validados nesta etapa.

O repositório continha `package-lock.json` incompleto e dois lockfiles. O lockfile do npm foi sincronizado e o do Yarn removido para eliminar instalações divergentes.

## Componentes

```text
App
├── Header
├── Resume
│   └── ResumeItem (3 instâncias)
└── Form
    └── Grid
        └── GridItem (uma instância por lançamento)
```

- `App` possui a lista de transações, calcula os resumos e persiste inclusões.
- `Form` controla descrição, valor e tipo da nova transação.
- `Grid` lista e exclui transações, persistindo a lista após a exclusão.
- `Resume` e `ResumeItem` exibem entradas, saídas e saldo.
- Cada pasta de componente contém seus estilos em styled-components.

## Persistência

A chave `transactions` do `localStorage` armazena um array JSON. Cada item possui:

```json
{
  "id": 101,
  "desc": "Salário",
  "amount": "2500",
  "expense": false
}
```

O valor é armazenado como texto e convertido para número durante os cálculos. A inclusão é persistida em `App`; a exclusão é persistida em `Grid`.

## Regras atuais de cálculo

1. Itens com `expense: true` compõem as saídas.
2. Itens com `expense: false` compõem as entradas.
3. Os valores de cada grupo são convertidos com `Number` e somados.
4. Entradas, saídas e saldo são arredondados para duas casas com `toFixed(2)`.
5. O saldo exibido é o módulo da diferença, recebendo o prefixo `-` quando as saídas superam as entradas.
6. Descrição e valor são obrigatórios; valores menores que 1 são rejeitados.

## Pontos reaproveitáveis

- Divisão visual em formulário, resumo e tabela.
- Modelo mental de entrada versus saída.
- Componentes de apresentação e estilos existentes.
- Fluxos de inclusão e exclusão protegidos pelos testes.
- Estrutura de dados atual, que pode ser mapeada para DTOs durante a migração.

## Riscos e possíveis bugs encontrados

- IDs usam apenas 1.001 valores aleatórios e podem colidir; uma exclusão pode remover mais de um item.
- Os rádios alternam o estado com `!isExpense`; eventos repetidos ou navegação incomum podem inverter o tipo incorretamente.
- JSON inválido no `localStorage` impede a aplicação de iniciar.
- Valores ficam como texto e aceitam números que não representam adequadamente dinheiro.
- Não há data, categoria, edição ou ordenação de lançamentos.
- A chave da lista usa o índice em vez do identificador, o que pode produzir reconciliação visual incorreta.
- Inclusão e exclusão duplicam a responsabilidade de gravar no `localStorage`.
- Formatação monetária é manual e não utiliza `Intl.NumberFormat`.
- Ícones clicáveis não possuem nome acessível nem alternativa de teclado.
- Create React App e parte da árvore de dependências estão obsoletos; a migração de build deve ser uma tarefa isolada futura.

Esses itens foram documentados, mas não corrigidos nesta etapa para evitar alterar simultaneamente o comportamento protegido.

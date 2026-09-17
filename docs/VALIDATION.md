# Validação da linha de base

> Registro histórico da aplicação inicial. A validação do runtime Firebase está em
> `npm test`, `npm run test:responsive` e `npm run test:firebase`.

Data da execução: 8 de setembro de 2026.

## Resultado

| Verificação | Resultado |
| --- | --- |
| Instalação reproduzível das dependências | Aprovada após sincronizar `package-lock.json` |
| Servidor de desenvolvimento | Aprovado; compilou e respondeu HTTP 200 em `localhost:3000` |
| Build de produção | Aprovado |
| ESLint | Aprovado sem erros ou avisos do código |
| Testes automatizados | 5 de 5 aprovados |

## Comportamentos protegidos

- Inicialização sem transações.
- Inclusão e persistência de entrada.
- Inclusão de saída e saldo negativo.
- Soma de múltiplas entradas e saídas.
- Restauração do estado salvo no navegador.
- Exclusão e atualização do `localStorage`.

## Observações

O repositório original não possuía arquivos de teste, apesar de incluir Testing Library. A suíte adicionada é uma proteção mínima de regressão, não uma cobertura completa.

Create React App emite avisos de depreciação do servidor de desenvolvimento, de uma API do Node e da base `caniuse-lite`. Eles não impedem lint, teste, inicialização ou build. A modernização do build deve ocorrer separadamente para não ampliar o escopo desta linha de base.

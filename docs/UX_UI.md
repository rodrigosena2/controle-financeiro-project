# UX/UI — auditoria antes da implementação (16/09/2026)

## Problemas observados no código atual

- Header de 150px sem uso proporcional do espaço; título com div dentro de h1.
- Cards com largura percentual somada a padding/gap, sem box-sizing global.
  Margin-top negativo e compensação inline de 70px tornam o layout frágil.
- Tabela com colunas cuja soma chega a 150%; nenhuma adaptação estrutural para mobile.
  Tipos dependem só de ícones/vermelho/verde e datas/valores não têm formato brasileiro.
- Inputs removem outline; botões de editar/excluir têm apenas ícones de 18px e nenhum
  alvo mínimo de toque. Exclusão acontece imediatamente sem confirmação.
- Formulário financeiro sem título/agrupamento claro; criação e edição diferem apenas
  no texto do botão. Validação aparece em um bloco distante, sem ligação aos campos.
- Login/cadastro usam estilos do navegador e não compartilham os padrões financeiros.
- Sucesso, erro, aviso, loading e vazio são parágrafos sem hierarquia visual.
- Cores, espaçamentos, bordas e larguras se repetem nos arquivos de estilos.
- Documento em inglês apesar da interface em português; dependência de fonte externa.

## Direção visual e escopo

Base mobile-first, fundo claro, superfície branca, verde escuro para saldo/ação principal,
tipografia de sistema, valores tabulares e uma escala de espaços compartilhada. Cards
de resumo adaptáveis; lista semântica com colunas no desktop e cards no celular.
Botões/campos com alvo mínimo de 44px, foco visível, validação local associada aos campos
e confirmação de exclusão por diálogo nativo. Preservar contratos/API e fluxos existentes.

Não serão adicionados gráficos, funcionalidades financeiras, bibliotecas de UI ou
alterações no backend. A validação inclui 360, 390, 430, 768 e 1440px, teclado e regressão.

## Linha de base

Antes das mudanças: 54 testes frontend aprovados. O restante deste documento será
complementado com resultados observados após a implementação.

## Implementação entregue

- O layout foi reorganizado em um shell com largura máxima, cabeçalho compacto,
  hierarquia de títulos e rodapé consistente.
- Tokens visuais compartilhados foram centralizados em `src/styles/global.js` e os
  controles reutilizáveis em `src/styles/ui.js`.
- O resumo usa três cards responsivos: saldo em destaque e receitas/despesas em
  colunas que se adaptam ao celular.
- A tabela foi substituída por uma lista semântica: colunas no desktop e cards no
  celular, com descrição, tipo textual, valor, data e ações sempre visíveis.
- Os formulários de autenticação e transação receberam labels associados, mensagens
  junto ao campo, foco visível, validação local mínima e botões com estados de espera.
- Exclusão usa diálogo nativo com confirmação, foco inicial, restauração do foco e
  contenção de Tab. Feedback de sucesso, erro, aviso, carregamento e lista vazia
  passou a usar o mesmo componente visual.
- `public/index.html` agora declara `pt-BR`, remove a dependência da fonte externa e
  define metadados básicos. Nenhuma regra de autenticação, persistência ou API foi
  alterada.

## Validação da entrega

Executado em 16/09/2026:

| Verificação | Resultado |
| --- | --- |
| `npm.cmd test -- --watchAll=false --runInBand` | 59 aprovados |
| `npm.cmd run lint` | aprovado, 0 avisos |
| `npm.cmd run build` | compilado com sucesso |
| `dotnet build ControleFinanceiro.slnx --no-restore` | 0 erros, 0 avisos |
| `dotnet test ControleFinanceiro.slnx --no-restore` | 22 aprovados |
| `npm.cmd run test:responsive` (Playwright + Chrome) | 37 verificações aprovadas |

O teste de navegador percorre 360, 390, 430, 768 e 1440 px e gera evidências em
`artifacts/ui/` (overflow horizontal, alvos de toque, ações sem sobreposição,
cadastro/login, criação/edição/exclusão, refresh, logout/login, erro da API,
sessão expirada, API indisponível e teclado). A API é simulada nesse roteiro para
isolar a camada visual; a persistência, autenticação e isolamento continuam cobertos
pela suíte .NET com SQL Server LocalDB real.

Para repetir o teste visual sem adicionar uma dependência de produção, gere o build e
aponte `PLAYWRIGHT_MODULE` para uma instalação local do Playwright:

```powershell
$env:PLAYWRIGHT_MODULE = 'C:\caminho\para\node_modules\playwright'
npm.cmd run build
npm.cmd run test:responsive
```

O roteiro valida localhost e o IPv4 disponível na máquina. O teste em um celular
físico depende de o firewall permitir a porta HTTPS da API e de o dispositivo
confiar no certificado de desenvolvimento; isso permanece uma verificação manual.

## Arquivos principais da etapa

- `src/App.js`, `src/App.styles.js` e `src/styles/global.js`: shell, espaçamento,
  estados e tokens.
- `src/components/AuthForm.js`, `Form/`, `Grid/`, `Griditem/`, `Resume/` e
  `ResumeItem/`: componentes de apresentação, responsividade e acessibilidade.
- `src/components/ConfirmDelete.js`, `Feedback.js`, `src/format.js` e
  `src/styles/ui.js`: confirmação, feedback, formatação e padrões reutilizáveis.
- `src/App.test.js`, `src/setupTests.js` e `scripts/test-responsive.cjs`: regressão
  de comportamento, diálogo e navegador.

## Pendências e riscos conhecidos

- A fonte é a pilha nativa do sistema para evitar dependência de rede; pequenas
  diferenças entre Windows, Android e iOS são esperadas.
- O roteiro não substitui teste manual em aparelho físico na rede local.
- O aviso do build sobre `caniuse-lite` desatualizado é informativo e não bloqueou
  a compilação; pode ser tratado em uma manutenção futura.

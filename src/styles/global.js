import { createGlobalStyle } from "styled-components";

export default createGlobalStyle`
  :root {
    color-scheme: light;
    --canvas: #f3f6f4; --canvas-deep: #e9efeb; --surface: #ffffff;
    --surface-raised: #ffffff; --surface-soft: #f7f9f8;
    --ink: #14221d; --ink-soft: #2f4039; --muted: #687770;
    --brand: #116149; --brand-strong: #0a4535; --brand-deep: #092f27;
    --brand-bright: #26bd78; --brand-soft: #e8f7ef;
    --income: #128958; --income-soft: #e7f7ef;
    --danger: #d74255; --danger-soft: #fff0f2;
    --warning: #9a6812; --warning-soft: #fff7df;
    --accent: #6558d9; --accent-soft: #efedff; --notice: #eef3f0;
    --border: #dfe7e2; --border-strong: #bac9c0; --input-border: #a9b8b0;
    --overlay: rgb(5 27 21 / 58%); --on-brand: #ffffff; --on-brand-muted: #c9e8db;
    --radius-xs: 8px; --radius-sm: 12px; --radius: 20px; --radius-lg: 28px;
    --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
    --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;
    --shadow-xs: 0 1px 2px rgb(10 49 39 / 4%);
    --shadow: 0 12px 35px rgb(10 49 39 / 7%);
    --shadow-lg: 0 28px 80px rgb(5 35 27 / 18%);
    --focus: #24a66c; --sidebar-width: 244px; --topbar-height: 82px;
  }
  :root[data-theme="dark"] {
    color-scheme: dark;
    --canvas: #101915; --canvas-deep: #0c1411; --surface: #17221d;
    --surface-raised: #1b2923; --surface-soft: #131e19;
    --ink: #f1f7f4; --ink-soft: #c8d5cf; --muted: #98aaa1;
    --brand: #48cb8a; --brand-strong: #2bad71; --brand-deep: #0a382b;
    --brand-bright: #5de39d; --brand-soft: #17392c;
    --income: #55d597; --income-soft: #17392c;
    --danger: #ff7786; --danger-soft: #3a2027;
    --warning: #f5c76a; --warning-soft: #352d1d;
    --accent: #a99fff; --accent-soft: #282543; --notice: #202d27;
    --border: #2d3b34; --border-strong: #45584e; --input-border: #53665c;
    --overlay: rgb(0 0 0 / 72%); --on-brand: #f8fffb; --on-brand-muted: #c5ead9;
    --shadow-xs: 0 1px 2px rgb(0 0 0 / 20%);
    --shadow: 0 14px 38px rgb(0 0 0 / 24%);
    --shadow-lg: 0 30px 90px rgb(0 0 0 / 48%); --focus: #6ce0a7;
  }
  *, *::before, *::after { box-sizing: border-box; }
  html { min-width: 320px; scroll-behavior: smooth; }
  body {
    min-width: 320px; margin: 0;
    font-family: Inter, ui-sans-serif, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    color: var(--ink); background: var(--canvas); line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    transition: color .2s ease, background-color .2s ease;
  }
  body:has(dialog[open]) { overflow: hidden; }
  h1, h2, h3, p { margin: 0; overflow-wrap: anywhere; }
  h1, h2, h3 { text-wrap: balance; }
  button, input, select { font: inherit; }
  button { -webkit-tap-highlight-color: transparent; }
  a { color: var(--brand); }
  :focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
  input:focus-visible, select:focus-visible { outline-offset: 1px; }
  ::selection { background: var(--brand-soft); color: var(--ink); }
  .skip-link {
    position: fixed; left: 16px; top: -100px; padding: 12px 16px;
    background: var(--surface); color: var(--ink); z-index: 200;
    border: 1px solid var(--border); border-radius: var(--radius-sm);
  }
  .skip-link:focus { top: 12px; }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
  }
`;

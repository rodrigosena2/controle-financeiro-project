import styled from "styled-components";

export const Disclosure = styled.details`
  border-top: 1px solid var(--border);
  summary {
    min-height: 52px; padding: 0 20px; display: flex; align-items: center; gap: 9px;
    color: var(--ink-soft); background: var(--surface-soft); cursor: pointer;
    font-size: .8125rem; font-weight: 680; list-style: none;
  }
  summary::-webkit-details-marker { display: none; }
  summary::after { content: "+"; margin-left: auto; color: var(--muted); font-size: 1rem; }
  &[open] summary::after { content: "−"; }
  summary svg { color: var(--brand); }
  @media (min-width: 768px) { summary { padding-inline: 28px; } }
`;
export const Form = styled.form`
  padding: 18px 20px 20px; border-top: 1px solid var(--border);
  background: var(--surface-soft); display: grid; gap: var(--space-3);
  @media (min-width: 768px) { padding: 20px 28px 24px; }
`;
export const Fields = styled.div`
  display: grid; gap: var(--space-3);
  label { font-size: .75rem; }
  input, select { min-height: 44px; font-size: .875rem; }
  @media (min-width: 640px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (min-width: 1180px) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
`;
export const Actions = styled.div`display: flex; justify-content: flex-end;`;

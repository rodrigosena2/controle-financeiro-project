import styled from "styled-components";

export const Button = styled.button`
  min-height: 44px; min-width: 44px; border: 1px solid transparent;
  border-radius: var(--radius-sm); padding: 10px 16px;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  font-weight: 680; line-height: 1.3; cursor: pointer;
  color: ${p => p.$variant === "danger" ? "var(--danger)" : p.$variant === "secondary" ? "var(--ink)" : "var(--on-brand)"};
  background: ${p => p.$variant === "danger" ? "var(--danger-soft)" : p.$variant === "secondary" ? "var(--surface)" : "var(--brand-strong)"};
  border-color: ${p => p.$variant === "secondary" ? "var(--border)" : "transparent"};
  box-shadow: ${p => p.$variant ? "none" : "0 8px 18px rgb(11 89 64 / 14%)"};
  transition: transform .16s ease, background-color .16s ease, border-color .16s ease, box-shadow .16s ease;
  &:hover:not(:disabled) { transform: translateY(-1px); border-color: currentColor; }
  &:active:not(:disabled) { transform: translateY(0); }
  &:disabled { opacity: .55; cursor: not-allowed; }
  svg { flex-shrink: 0; }
`;
export const Card = styled.section`
  min-width: 0; background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); box-shadow: var(--shadow-xs);
`;
export const Input = styled.input`
  width: 100%; min-width: 0; min-height: 48px; padding: 11px 13px;
  border: 1px solid var(--input-border); border-radius: var(--radius-sm);
  background: var(--surface); color: var(--ink); font-size: 1rem;
  transition: border-color .15s ease, background-color .2s ease, box-shadow .15s ease;
  &:focus { border-color: var(--brand); box-shadow: 0 0 0 4px var(--brand-soft); }
  &[aria-invalid="true"] { border-color: var(--danger); }
  &:disabled { background: var(--canvas); color: var(--muted); }
  &::placeholder { color: var(--muted); opacity: .82; }
`;
export const Select = styled.select`
  width: 100%; min-width: 0; min-height: 48px; padding: 11px 36px 11px 13px;
  border: 1px solid var(--input-border); border-radius: var(--radius-sm);
  background: var(--surface); color: var(--ink); font-size: 1rem;
  transition: border-color .15s ease, background-color .2s ease, box-shadow .15s ease;
  &:focus { border-color: var(--brand); box-shadow: 0 0 0 4px var(--brand-soft); }
  &[aria-invalid="true"] { border-color: var(--danger); }
  &:disabled { background: var(--canvas); color: var(--muted); }
`;
export const Field = styled.div`display: grid; gap: 7px; min-width: 0;`;
export const Label = styled.label`font-size: .8125rem; font-weight: 680; color: var(--ink-soft);`;
export const Hint = styled.p`font-size: .8125rem; color: var(--muted); line-height: 1.55;`;
export const FieldError = styled.p`font-size: .8125rem; color: var(--danger); line-height: 1.5;`;
export const Actions = styled.div`display: flex; flex-wrap: wrap; gap: var(--space-2); & > * { flex: 1; }`;
export const Eyebrow = styled.p`
  color: var(--brand); font-size: .6875rem; letter-spacing: .14em;
  font-weight: 760; text-transform: uppercase;
`;
export const Muted = styled.p`color: var(--muted); line-height: 1.6;`;

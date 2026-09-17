import styled from "styled-components";
export const Row = styled.li`
  padding: 18px 20px; border-bottom: 1px solid var(--border);
  display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px 14px; align-items: center;
  transition: background-color .15s ease;
  &:hover { background: var(--surface-soft); }
  &:last-child { border-bottom: 0; }
  @media (min-width: 960px) {
    grid-template-columns: minmax(220px, 1.3fr) minmax(100px, .65fr) 96px 130px minmax(148px, .7fr);
    gap: 16px; padding: 18px 28px;
  }
`;
export const Description = styled.div`
  min-width: 0; grid-column: 1 / -1; display: flex; align-items: center; gap: 12px;
  > div { min-width: 0; display: flex; align-items: center; flex-wrap: wrap; gap: 5px 8px; }
  h3 { width: 100%; font-size: .875rem; font-weight: 680; line-height: 1.4; }
  @media (min-width: 960px) { grid-column: auto; }
`;
export const TransactionIcon = styled.span`
  width: 40px; height: 40px; border-radius: 13px; flex: 0 0 auto;
  display: grid; place-items: center;
  color: ${p => p.$expense ? "var(--danger)" : "var(--income)"};
  background: ${p => p.$expense ? "var(--danger-soft)" : "var(--income-soft)"};
  svg { width: 18px; height: 18px; }
`;
export const Type = styled.span`
  color: ${p => p.$expense ? "var(--danger)" : "var(--income)"};
  font-size: .6875rem; font-weight: 680;
`;
export const Meta = styled.span`display: inline-flex; align-items: center; gap: 4px; color: var(--muted); font-size: .6875rem;`;
export const Category = styled.span`
  justify-self: start; padding: 4px 9px; border-radius: 999px;
  color: var(--brand); background: var(--brand-soft); font-size: .6875rem; font-weight: 650;
`;
export const Amount = styled.p`
  justify-self: end; color: ${p => p.$expense ? "var(--danger)" : "var(--income)"};
  font-variant-numeric: tabular-nums; font-weight: 720; font-size: .875rem;
  overflow-wrap: anywhere; min-width: 0;
  @media (max-width: 959px) { grid-column: 2; grid-row: 2; }
`;
export const Date = styled.time`
  color: var(--muted); font-size: .75rem; font-variant-numeric: tabular-nums;
  @media (max-width: 959px) { grid-column: 1; grid-row: 2; }
`;
export const Actions = styled.div`
  grid-column: 1 / -1; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 7px;
  button { min-height: 44px; font-size: .6875rem; padding: 7px 9px; }
  @media (min-width: 960px) { grid-column: auto; }
`;

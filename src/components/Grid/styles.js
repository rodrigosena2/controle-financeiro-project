import styled from "styled-components";
import { Card } from "../../styles/ui";
export const Panel = styled(Card)`overflow: clip; box-shadow: var(--shadow);`;
export const Header = styled.div`
  padding: 22px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px;
  h2 { font-size: 1.125rem; letter-spacing: -.025em; }
  > span { white-space: nowrap; background: var(--surface-soft); border: 1px solid var(--border);
    padding: 6px 11px; border-radius: 30px; color: var(--muted); font-size: .6875rem; }
  @media (min-width: 768px) { padding: 24px 28px; }
`;
export const Labels = styled.div`
  display: none;
  @media (min-width: 960px) {
    display: grid; grid-template-columns: minmax(220px, 1.3fr) minmax(100px, .65fr) 96px 130px minmax(148px, .7fr); gap: 16px;
    padding: 11px 28px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
    background: var(--surface-soft); font-size: .625rem; font-weight: 720;
    color: var(--muted); text-transform: uppercase; letter-spacing: .08em;
    span:nth-last-child(-n + 2) { text-align: right; }
  }
`;
export const List = styled.ul`list-style: none; margin: 0; padding: 0;`;
export const Empty = styled.div`
  padding: 58px 24px 64px; border-top: 1px solid var(--border);
  text-align: center; display: grid; gap: 8px; justify-items: center;
  svg { width: 42px; height: 42px; color: var(--brand); margin-bottom: 8px; }
  h3 { font-size: 1rem; }
  p { max-width: 340px; color: var(--muted); font-size: .875rem; }
`;
export const Pagination = styled.nav`
  padding: var(--space-4) var(--space-5); border-top: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: var(--space-3);
  span { color: var(--muted); font-size: .8125rem; }
`;

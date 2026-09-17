import styled from "styled-components";
export const Container = styled.div`
  position: relative; isolation: isolate; overflow: hidden; min-width: 0; min-height: ${p => p.$primary ? "180px" : "150px"};
  padding: 20px; border-radius: var(--radius);
  background: ${p => p.$primary ? "linear-gradient(145deg, var(--brand-deep), var(--brand-strong))" : "var(--surface)"};
  color: ${p => p.$primary ? "var(--on-brand)" : "var(--ink)"};
  border: 1px solid ${p => p.$primary ? "transparent" : "var(--border)"};
  box-shadow: ${p => p.$primary ? "var(--shadow)" : "var(--shadow-xs)"};
  display: grid; gap: 12px; align-content: space-between;
  transition: transform .18s ease, box-shadow .18s ease;
  &::after { content: ""; display: ${p => p.$primary ? "block" : "none"}; position: absolute; z-index: -1;
    width: 220px; height: 220px; right: -80px; bottom: -125px; border-radius: 50%;
    background: radial-gradient(circle, rgb(78 223 148 / 36%), transparent 68%); }
  &:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
  @media (min-width: 768px) { padding: 24px; }
`;
export const Header = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  h2 { font-size: .8125rem; font-weight: 570; color: ${p => p.$primary ? "var(--on-brand-muted)" : "var(--muted)"}; }
`;
export const Icon = styled.span`
  border-radius: 12px; display: grid; place-items: center; width: 38px; height: 38px; flex-shrink: 0;
  color: ${p => p.$primary ? "var(--brand-bright)" : "var(--brand)"};
  background: ${p => p.$primary ? "rgb(255 255 255 / 10%)" : "var(--brand-soft)"};
  svg { width: 18px; height: 18px; }
`;
export const Total = styled.p`
  font-size: clamp(1.35rem, 3vw, ${p => p.$primary ? "2.4rem" : "1.8rem"});
  font-weight: 720; line-height: 1.1; letter-spacing: -.045em;
  font-variant-numeric: tabular-nums; overflow-wrap: anywhere;
`;
export const Hint = styled.p`
  font-size: .6875rem; color: ${p => p.$primary ? "var(--on-brand-muted)" : "var(--muted)"};
`;

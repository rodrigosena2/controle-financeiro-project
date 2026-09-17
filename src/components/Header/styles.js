import styled from "styled-components";
export const Container = styled.header`
  position: relative; z-index: 10; background: color-mix(in srgb, var(--canvas) 88%, transparent);
  border-bottom: 1px solid var(--border); backdrop-filter: blur(16px);
`;
export const Inner = styled.div`
  max-width: 1240px; margin: auto; min-height: 82px; padding: 14px 16px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  @media (min-width: 768px) { padding-inline: 32px; }
`;
export const Brand = styled.div`
  display: flex; align-items: center; gap: 11px; min-width: 0;
  strong { display: block; font-size: .9375rem; letter-spacing: -.025em; }
  small { display: block; color: var(--muted); font-size: .6875rem; margin-top: 1px; }
`;
export const Mark = styled.span`
  width: 42px; height: 42px; border-radius: 14px 14px 14px 5px;
  background: linear-gradient(145deg, var(--brand-bright), var(--brand-strong)); color: white;
  display: grid; place-items: center; flex-shrink: 0; box-shadow: 0 9px 22px rgb(17 97 73 / 18%);
  svg { width: 21px; height: 21px; }
`;

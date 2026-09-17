import styled from "styled-components";

export const Shell = styled.div`min-height: 100dvh;`;
export const Sidebar = styled.aside`
  display: none;
  @media (min-width: 1024px) {
    position: fixed; inset: 0 auto 0 0; z-index: 20;
    width: var(--sidebar-width); padding: 30px 22px 24px;
    display: flex; flex-direction: column;
    background: var(--surface); border-right: 1px solid var(--border);
  }
`;
export const Brand = styled.a`
  display: inline-flex; align-items: center; gap: 11px; color: var(--ink);
  text-decoration: none; min-width: 0;
  > span { display: grid; line-height: 1.02; font-size: .9375rem; letter-spacing: -.025em; }
  strong { font-weight: 760; }
`;
export const Mark = styled.span`
  width: 42px; height: 42px; border-radius: 14px 14px 14px 5px;
  display: grid; place-items: center; flex: 0 0 auto;
  color: white; background: linear-gradient(145deg, var(--brand-bright), var(--brand-strong));
  box-shadow: 0 9px 22px rgb(17 97 73 / 18%);
  svg { width: 21px; height: 21px; }
`;
export const Navigation = styled.nav`
  display: grid; gap: 7px; margin-top: 46px;
  a {
    min-height: 48px; padding: 0 14px; border-radius: 13px;
    display: flex; align-items: center; gap: 12px;
    color: var(--muted); text-decoration: none; font-size: .875rem; font-weight: 620;
  }
  a:hover { color: var(--ink); background: var(--surface-soft); }
  a[aria-current="page"] { color: var(--brand); background: var(--brand-soft); }
  svg { width: 19px; height: 19px; }
`;
export const SideNote = styled.div`
  margin-top: auto; padding: 20px; border-radius: var(--radius);
  color: var(--on-brand); background:
    radial-gradient(circle at 100% 100%, rgb(65 211 139 / 28%), transparent 48%),
    linear-gradient(145deg, var(--brand-deep), var(--brand-strong));
  box-shadow: var(--shadow);
  svg { width: 22px; height: 22px; color: var(--brand-bright); margin-bottom: 28px; }
  p { font-size: .875rem; font-weight: 650; }
`;
export const Profile = styled.div`
  display: flex; align-items: center; gap: 11px; margin-top: 22px; min-width: 0;
  > span { min-width: 0; display: grid; }
  strong, small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  strong { font-size: .8125rem; }
  small { color: var(--muted); font-size: .6875rem; }
`;
export const Avatar = styled.span`
  width: 38px; height: 38px; border-radius: 50%; flex: 0 0 auto;
  display: grid; place-items: center; color: white; background: var(--brand-deep);
  font-size: .75rem; font-weight: 760;
`;
export const Content = styled.div`
  min-width: 0;
  @media (min-width: 1024px) { margin-left: var(--sidebar-width); }
`;
export const Topbar = styled.header`
  min-height: var(--topbar-height); padding: 14px 16px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  background: color-mix(in srgb, var(--canvas) 88%, transparent);
  border-bottom: 1px solid var(--border); backdrop-filter: blur(16px);
  position: sticky; top: 0; z-index: 15;
  @media (min-width: 768px) { padding-inline: 28px; }
  @media (min-width: 1024px) { justify-content: flex-end; padding-inline: 40px; }
`;
export const MobileBrand = styled.div`@media (min-width: 1024px) { display: none; }`;
export const TopActions = styled.div`display: flex; align-items: center; justify-content: flex-end; gap: 8px;`;
export const Period = styled.span`
  display: none; min-height: 44px; padding: 0 14px; align-items: center;
  border: 1px solid var(--border); border-radius: 999px; background: var(--surface);
  color: var(--ink-soft); font-size: .8125rem; font-weight: 650;
  @media (min-width: 580px) { display: inline-flex; }
`;
export const ActionText = styled.span`display: none; @media (min-width: 700px) { display: inline; }`;
export const MobileNav = styled.nav`
  position: fixed; z-index: 30; inset: auto 12px 12px; height: 68px;
  display: grid; grid-template-columns: 1fr 1fr 68px 1fr; align-items: center;
  padding: 6px 8px; border: 1px solid var(--border); border-radius: 22px;
  background: color-mix(in srgb, var(--surface) 94%, transparent);
  box-shadow: var(--shadow-lg); backdrop-filter: blur(18px);
  a { min-height: 52px; display: grid; place-items: center; align-content: center; gap: 2px;
    color: var(--muted); text-decoration: none; font-size: .625rem; }
  a:first-child { color: var(--brand); }
  a svg { width: 19px; height: 19px; }
  button { width: 56px; height: 56px; margin: -24px auto 0; border: 5px solid var(--canvas);
    border-radius: 50%; display: grid; place-items: center; cursor: pointer;
    color: white; background: var(--brand-strong); box-shadow: 0 10px 24px rgb(8 64 47 / 28%); }
  button:disabled { opacity: .55; }
  button svg { width: 23px; height: 23px; }
  @media (min-width: 768px) { display: none; }
`;

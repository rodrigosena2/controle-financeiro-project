import styled from "styled-components";
export { Label, Input, Select, Field as InputContent } from "../../styles/ui";

export const Workspace = styled.section`min-width: 0; scroll-margin-top: calc(var(--topbar-height) + 20px);`;
export const Drawer = styled.dialog`
  width: min(520px, 100%); height: 100dvh; max-height: none; margin: 0 0 0 auto;
  padding: 0; border: 0; border-left: 1px solid var(--border); border-radius: 28px 0 0 28px;
  color: var(--ink); background: var(--surface); box-shadow: var(--shadow-lg); overflow: auto;
  transform: translateX(0); animation: drawer-in .22s ease-out;
  &::backdrop { background: var(--overlay); backdrop-filter: blur(3px); }
  form { padding: 0 28px 32px; }
  @keyframes drawer-in { from { transform: translateX(24px); opacity: .65; } }
  @media (max-width: 600px) {
    width: 100%; height: min(90dvh, 760px); margin: auto 0 0; border-left: 0;
    border-top: 1px solid var(--border); border-radius: 24px 24px 0 0;
    animation-name: drawer-up;
    form { padding: 0 18px 30px; }
    @keyframes drawer-up { from { transform: translateY(24px); opacity: .65; } }
  }
`;
export const DrawerHeader = styled.div`
  position: sticky; top: 0; z-index: 2; padding: 28px 28px 20px;
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
  background: color-mix(in srgb, var(--surface) 92%, transparent); backdrop-filter: blur(14px);
  > div { display: grid; gap: 6px; }
  h2 { font-size: 1.55rem; letter-spacing: -.035em; }
  @media (max-width: 600px) { padding: 22px 18px 18px; }
`;
export const Kicker = styled.p`
  color: var(--brand); font-size: .6875rem; letter-spacing: .13em; font-weight: 760; text-transform: uppercase;
`;
export const Close = styled.button`
  width: 44px; height: 44px; flex: 0 0 auto; border: 1px solid var(--border); border-radius: 50%;
  display: grid; place-items: center; color: var(--ink); background: var(--surface); cursor: pointer;
  svg { width: 19px; height: 19px; }
`;
export const Fields = styled.fieldset`
  min-width: 0; border: 0; padding: 0; margin: 8px 0 0; display: grid; gap: var(--space-4);
`;
export const Pair = styled.div`
  display: grid; gap: var(--space-4);
  @media (min-width: 430px) { grid-template-columns: 1fr 1fr; }
`;
export const RadioGroup = styled.fieldset`
  border: 0; padding: 0; margin: 0; min-width: 0;
  legend { font-size: .8125rem; font-weight: 680; color: var(--ink-soft); margin-bottom: 8px; }
  > div { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 5px; background: var(--surface-soft); border-radius: 15px; }
  label { display: flex; align-items: center; justify-content: center; gap: 8px;
    min-height: 46px; border: 1px solid transparent; border-radius: 11px;
    cursor: pointer; font-size: .875rem; padding: 10px; color: var(--muted); }
  label:has(input:checked) { border-color: var(--border); color: var(--brand); background: var(--surface); box-shadow: var(--shadow-xs); }
  input { width: 16px; height: 16px; margin: 0; accent-color: var(--brand); }
`;

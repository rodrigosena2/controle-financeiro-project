import styled from "styled-components";
import { Card } from "./styles/ui";

export const Main = styled.main`
  max-width: 1260px; margin: 0 auto; padding: 28px 16px 112px;
  display: grid; gap: var(--space-5);
  @media (min-width: 768px) { padding: 40px 28px 64px; gap: var(--space-6); }
  @media (min-width: 1200px) { padding-inline: 40px; }
`;
export const Heading = styled.div`
  display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-4);
  h1 { font-size: clamp(1.65rem, 3.2vw, 2.35rem); letter-spacing: -.045em; line-height: 1.12; }
  > div { display: grid; gap: var(--space-2); }
  @media (max-width: 639px) { align-items: start; }
`;
export const NewButton = styled.div`
  display: none;
  @media (max-width: 767px) { display: none !important; }
  @media (min-width: 768px) { display: block; flex: 0 0 auto; }
`;
export const Messages = styled.div`display: grid; gap: var(--space-2); &:empty { display: none; }`;
export const PublicMain = styled.main`
  max-width: 1240px; min-height: calc(100dvh - 82px); margin: 0 auto;
  padding: 24px 16px 40px; display: grid; align-items: center;
  @media (min-width: 768px) { padding: 38px 32px 56px; }
`;
export const AuthLayout = styled.div`
  display: grid; gap: var(--space-5); align-items: stretch;
  @media (min-width: 900px) { grid-template-columns: minmax(0, 1.12fr) minmax(380px, .88fr); min-height: 650px; }
`;
export const Intro = styled.section`
  position: relative; overflow: hidden; isolation: isolate;
  min-height: 310px; padding: clamp(28px, 5vw, 64px);
  display: flex; flex-direction: column; justify-content: space-between; gap: var(--space-7);
  border-radius: var(--radius-lg); color: var(--on-brand);
  background:
    radial-gradient(circle at 84% 15%, rgb(90 225 155 / 30%), transparent 27%),
    radial-gradient(circle at 72% 90%, rgb(109 90 223 / 28%), transparent 32%),
    linear-gradient(145deg, #081712, var(--brand-deep));
  box-shadow: var(--shadow-lg);
  &::after { content: ""; position: absolute; z-index: -1; width: 230px; height: 230px;
    right: -55px; bottom: -65px; border: 1px solid rgb(255 255 255 / 14%); border-radius: 48% 52% 38% 62%;
    transform: rotate(18deg); box-shadow: -48px -32px 0 -10px rgb(84 215 145 / 8%); }
  h1 { max-width: 590px; font-size: clamp(2.35rem, 6vw, 4.7rem); font-weight: 720;
    line-height: .98; letter-spacing: -.065em; }
  h1 span { color: var(--brand-bright); }
  > div:first-child { display: grid; gap: var(--space-5); }
  > div:first-child p { max-width: 470px; color: var(--on-brand-muted); font-size: 1rem; }
  @media (max-width: 899px) { min-height: 330px; h1 { max-width: 520px; } }
  @media (max-width: 520px) { min-height: 285px; border-radius: var(--radius); h1 { font-size: 2.5rem; } }
`;
export const IntroPoints = styled.div`
  display: flex; flex-wrap: wrap; gap: 10px;
  span { display: inline-flex; align-items: center; gap: 7px; padding: 8px 11px;
    border: 1px solid rgb(255 255 255 / 12%); border-radius: 999px;
    color: var(--on-brand-muted); background: rgb(255 255 255 / 6%); font-size: .75rem; }
  svg { color: var(--brand-bright); }
`;
export const AuthColumn = styled.div`display: grid; place-items: center; padding: 8px 0;`;
export const AuthCard = styled(Card)`
  width: 100%; max-width: 470px; padding: clamp(24px, 4vw, 42px); display: grid; gap: var(--space-6);
  align-self: center; border-radius: var(--radius-lg); box-shadow: var(--shadow);
  > div:first-child { display: grid; gap: var(--space-2); }
  h2 { font-size: clamp(1.5rem, 3vw, 2rem); letter-spacing: -.035em; }
  form { display: grid; gap: var(--space-4); }
`;
export const Footer = styled.footer`
  border-top: 1px solid var(--border); padding-top: var(--space-5);
  color: var(--muted); font-size: .75rem; text-align: center;
`;

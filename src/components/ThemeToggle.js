import React from "react";
import styled from "styled-components";
import { FiMoon, FiSun } from "react-icons/fi";

const Toggle = styled.button`
  min-width: 44px; min-height: 44px; padding: 0 13px;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border: 1px solid var(--border); border-radius: 999px;
  color: var(--ink); background: var(--surface); cursor: pointer;
  font-size: .8125rem; font-weight: 680;
  transition: background-color .2s ease, border-color .2s ease, transform .16s ease;
  &:hover { border-color: var(--brand); transform: translateY(-1px); }
  svg { width: 17px; height: 17px; }
  span { display: none; }
  @media (min-width: 640px) { span { display: inline; } }
`;

export default function ThemeToggle({ theme, onToggle }) {
  const dark = theme === "dark";
  return <Toggle type="button" onClick={onToggle}
    aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
    title={dark ? "Ativar tema claro" : "Ativar tema escuro"}>
    {dark ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
    <span>{dark ? "Claro" : "Escuro"}</span>
  </Toggle>;
}

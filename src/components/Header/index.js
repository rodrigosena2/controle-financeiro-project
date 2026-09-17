import React from "react";
import { FiTrendingUp } from "react-icons/fi";
import ThemeToggle from "../ThemeToggle";
import * as C from "./styles";

export default function Header({ theme, onThemeToggle }) {
  return <>
    <a className="skip-link" href="#main-content">Ir para o conteúdo</a>
    <C.Container><C.Inner>
      <C.Brand><C.Mark><FiTrendingUp aria-hidden="true" /></C.Mark>
        <div><strong>Controle Financeiro</strong><small>Mais clareza, todos os dias.</small></div>
      </C.Brand>
      <ThemeToggle theme={theme} onToggle={onThemeToggle} />
    </C.Inner></C.Container>
  </>;
}

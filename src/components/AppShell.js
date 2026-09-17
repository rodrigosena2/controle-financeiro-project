import React from "react";
import { FiBarChart2, FiHome, FiList, FiLogOut, FiPlus, FiTrendingUp } from "react-icons/fi";
import ThemeToggle from "./ThemeToggle";
import { Button } from "../styles/ui";
import * as C from "./AppShell.styles";

const initials = name => (name || "U").trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();

function Brand() {
  return <C.Brand href="#overview" aria-label="Controle Financeiro — visão geral">
    <C.Mark><FiTrendingUp aria-hidden="true" /></C.Mark>
    <span><strong>Controle</strong><strong>Financeiro</strong></span>
  </C.Brand>;
}

export default function AppShell({ user, theme, onThemeToggle, onLogout, onNewTransaction,
  busy, newTransactionDisabled, periodLabel, children }) {
  return <C.Shell>
    <a className="skip-link" href="#main-content">Ir para o conteúdo</a>
    <C.Sidebar aria-label="Navegação principal">
      <Brand />
      <C.Navigation>
        <a href="#overview" aria-current="page"><FiHome aria-hidden="true" />Visão geral</a>
        <a href="#transactions"><FiList aria-hidden="true" />Transações</a>
      </C.Navigation>
      <C.SideNote><FiBarChart2 aria-hidden="true" /><p>Clareza hoje.<br />Liberdade amanhã.</p></C.SideNote>
      <C.Profile>
        <C.Avatar aria-hidden="true">{initials(user.displayName)}</C.Avatar>
        <span><strong>{user.displayName}</strong><small>{user.email}</small></span>
      </C.Profile>
    </C.Sidebar>
    <C.Content>
      <C.Topbar>
        <C.MobileBrand><Brand /></C.MobileBrand>
        <C.TopActions>
          <C.Period aria-label={`Período selecionado: ${periodLabel}`}>{periodLabel}</C.Period>
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
          <Button $variant="secondary" disabled={busy} onClick={onLogout} aria-label="Sair">
            <FiLogOut aria-hidden="true" /><C.ActionText>Sair</C.ActionText>
          </Button>
        </C.TopActions>
      </C.Topbar>
      {children}
    </C.Content>
    <C.MobileNav aria-label="Navegação móvel">
      <a href="#overview"><FiHome aria-hidden="true" /><span>Início</span></a>
      <a href="#transactions"><FiList aria-hidden="true" /><span>Transações</span></a>
      <button type="button" onClick={onNewTransaction} disabled={newTransactionDisabled} aria-label="Nova transação">
        <FiPlus aria-hidden="true" />
      </button>
      <a href="#overview"><FiBarChart2 aria-hidden="true" /><span>Resumo</span></a>
    </C.MobileNav>
  </C.Shell>;
}

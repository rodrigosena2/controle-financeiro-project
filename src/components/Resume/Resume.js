import React from "react";
import ResumeItem from "../ResumeItem/ResumeItem";
import { FiArrowDownLeft, FiArrowUpRight, FiCreditCard } from "react-icons/fi";
import * as C from "./styles";

export default function Resume({ income, expense, total }) {
  return <C.Container aria-label="Resumo financeiro">
    <ResumeItem title="Saldo do período" id="total" Icon={FiCreditCard} value={total} primary hint="Receitas menos despesas" />
    <ResumeItem title="Receitas" id="entradas" Icon={FiArrowDownLeft} value={income} hint="Entradas do período" />
    <ResumeItem title="Despesas" id="saídas" Icon={FiArrowUpRight} value={expense} hint="Saídas do período" />
  </C.Container>;
}

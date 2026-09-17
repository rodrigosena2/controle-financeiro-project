import React from "react";
import { formatMoney } from "../../format";
import * as C from "./styles";
export default function ResumeItem({ title, id, Icon, value, primary, hint }) {
  return <C.Container $primary={primary}>
    <C.Header $primary={primary}><h2>{title}</h2><C.Icon $primary={primary}><Icon aria-hidden="true" /></C.Icon></C.Header>
    <C.Total $primary={primary} data-testid={`summary-${id}`}>{formatMoney(value)}</C.Total>
    <C.Hint $primary={primary}>{hint}</C.Hint>
  </C.Container>;
}

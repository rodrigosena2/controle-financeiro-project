import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { FiTrash2 } from "react-icons/fi";
import { Button, Actions, Eyebrow, Muted } from "../styles/ui";
import { formatMoney } from "../format";

const Dialog = styled.dialog`
  width: min(440px, calc(100% - 32px)); max-height: calc(100dvh - 32px);
  padding: 24px; border: 1px solid var(--border); border-radius: var(--radius);
  color: var(--ink); background: var(--surface); box-shadow: 0 24px 80px #10291c33;
  &::backdrop { background: #152b2266; }
  h2 { font-size: 1.4rem; margin: 8px 0 12px; }
  p { overflow-wrap: anywhere; }
  strong { display: block; margin: 16px 0 24px; }
`;
export default function ConfirmDelete({ item, onCancel, onConfirm }) {
  const dialog = useRef(null);
  const cancel = useRef(null);
  const [working, setWorking] = useState(false);
  const locked = useRef(false);
  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current;
    element.showModal();
    cancel.current.focus();
    return () => {
      element.close();
      const target = previous?.isConnected ? previous : document.getElementById("transactions-title");
      target?.focus();
    };
  }, []);
  const confirm = async () => {
    if (locked.current) return;
    locked.current = true;
    setWorking(true);
    try { await onConfirm(item.id); }
    finally { onCancel(); }
  };
  return createPortal(<Dialog ref={dialog} aria-labelledby="delete-title" aria-describedby="delete-description"
    onKeyDown={event => {
      if (event.key !== "Tab") return;
      const buttons = [...dialog.current.querySelectorAll("button:not(:disabled)")];
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }}
    onCancel={event => { event.preventDefault(); if (!locked.current) onCancel(); }}>
    <Eyebrow>Confirmar exclusão</Eyebrow>
    <h2 id="delete-title">Excluir transação?</h2>
    <Muted id="delete-description">Este lançamento será removido da sua conta. Essa ação não pode ser desfeita.</Muted>
    <strong>{item.desc} · {formatMoney(item.amount)}</strong>
    <Actions>
      <Button ref={cancel} type="button" $variant="secondary" disabled={working} onClick={onCancel}>Cancelar</Button>
      <Button type="button" $variant="danger" disabled={working} onClick={confirm}>
        <FiTrash2 aria-hidden="true" />{working ? "Excluindo..." : "Confirmar exclusão"}
      </Button>
    </Actions>
  </Dialog>, document.body);
}

import React from "react";
import styled from "styled-components";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiLoader } from "react-icons/fi";

const Box = styled.div`
  display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px;
  border-radius: var(--radius-sm); line-height: 1.6; font-size: .875rem;
  color: ${p => p.$kind === "error" ? "var(--danger)" : "var(--ink)"};
  background: ${p => p.$kind === "error" ? "var(--danger-soft)" : p.$kind === "success" ? "var(--brand-soft)" : "var(--notice)"};
  border: 1px solid ${p => p.$kind === "error" ? "#edc6c2" : "var(--border)"};
  svg { flex: 0 0 20px; height: 20px; margin-top: 1px; }
  span { overflow-wrap: anywhere; }
`;
const icons = { error: FiAlertCircle, success: FiCheckCircle, warning: FiInfo, loading: FiLoader };
export default function Feedback({ kind = "warning", children }) {
  const Icon = icons[kind];
  return <Box $kind={kind} role={kind === "error" ? "alert" : kind === "warning" ? undefined : "status"}>
    <Icon aria-hidden="true" /><span>{children}</span>
  </Box>;
}

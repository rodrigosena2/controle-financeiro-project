// Detection only: legacy financial data is never written, deleted or imported.
// Import requires server-side deduplication before it can safely be offered again.
export function legacyNotice() {
  try {
    const raw = localStorage.getItem("transactions");
    if (!raw) return "";
    const values = JSON.parse(raw);
    if (Array.isArray(values) && values.length === 0) return "";
    return "Há dados antigos neste navegador. Eles foram preservados. A importação está desativada para evitar duplicações.";
  } catch {
    return "Não foi possível verificar os dados antigos do navegador. Isso não impede o uso da conta.";
  }
}

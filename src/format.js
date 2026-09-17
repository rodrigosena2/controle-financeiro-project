const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatMoney = value => currency.format(Number(value));
export function formatDate(value) {
  if (!value) return "Data não informada";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

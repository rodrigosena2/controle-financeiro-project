// CRA injects this public configuration at build time. Never put secrets here.
export const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "/api").replace(/\/+$/, "");

export function resolveApiBase(base = API_BASE_URL, origin = window.location.origin) {
  const resolved = new URL(base, origin);
  if ((!base.startsWith("/") && !/^https?:\/\//.test(base)) ||
      resolved.origin !== origin || resolved.search || resolved.hash) {
    throw new Error("Configure a API na mesma origem HTTPS da aplicação (por exemplo, /api).");
  }
  return resolved.pathname.replace(/\/+$/, "");
}

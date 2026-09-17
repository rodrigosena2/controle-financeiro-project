import { resolveApiBase } from "./config";
export { API_BASE_URL } from "./config";

export class ApiError extends Error {
  constructor(message, status = 0, kind = "http") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.kind = kind;
  }
}

async function responseError(response) {
  const problem = await response.json().catch(() => null);
  const defaults = {
    400: "Confira os dados informados e tente novamente.",
    401: "Sua sessão expirou. Entre novamente para continuar.",
    403: "Você não tem permissão para realizar esta operação.",
    404: "Registro não encontrado. Atualize os dados e tente novamente.",
    409: "Os dados foram alterados. Atualize a lista antes de continuar.",
    429: "Muitas tentativas. Aguarde um minuto e tente novamente."
  };
  if (response.status >= 500) {
    return new ApiError("O servidor não conseguiu concluir a solicitação. Tente novamente mais tarde.", response.status);
  }
  const validation = problem?.errors && typeof problem.errors === "object"
    ? Object.values(problem.errors).flat().filter(value => typeof value === "string").join(" ")
    : "";
  const detail = typeof problem?.detail === "string" ? problem.detail : "";
  const title = typeof problem?.title === "string" ? problem.title : "";
  return new ApiError(validation || detail || title || defaults[response.status] ||
    "Não foi possível concluir a operação.", response.status);
}

async function readJson(response) {
  try { return await response.json(); }
  catch { throw new ApiError("A API retornou uma resposta inválida. Atualize os dados.", response.status, "protocol"); }
}

async function send(path, { method = "GET", body } = {}) {
  const unsafe = !["GET", "HEAD", "OPTIONS"].includes(method);
  const headers = body ? { "Content-Type": "application/json" } : {};
  let base;
  try { base = resolveApiBase(); }
  catch (error) { throw new ApiError(error.message, 0, "configuration"); }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const options = { credentials: "include", cache: "no-store", signal: controller.signal };
  try {
    if (unsafe) {
      const csrf = await fetch(base + "/auth/csrf", options);
      if (!csrf.ok) throw await responseError(csrf);
      const token = (await readJson(csrf))?.token;
      if (typeof token !== "string" || !token) {
        throw new ApiError("Não foi possível validar a sessão. Atualize a página.", 0, "protocol");
      }
      headers["X-CSRF-TOKEN"] = token;
    }
    const response = await fetch(base + path, {
      ...options, method, headers,
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    if (!response.ok) throw await responseError(response);
    return response.status === 204 ? null : await readJson(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(controller.signal.aborted
      ? "O servidor demorou para responder. Verifique a conexão e atualize os dados."
      : "Não foi possível conectar à API. Verifique se o servidor está disponível.", 0, "network");
  } finally { clearTimeout(timeout); }
}

export const authApi = {
  register: body => send("/auth/register", { method: "POST", body }),
  login: body => send("/auth/login", { method: "POST", body }),
  logout: () => send("/auth/logout", { method: "POST" }),
  me: () => send("/auth/me")
};

export const transactionsApi = {
  list: (query = {}) => send("/transactions" + toQuery(query)),
  summary: (query = {}) => send("/transactions/summary" + toQuery(query)),
  categories: () => send("/transactions/categories"),
  create: body => send("/transactions", { method: "POST", body }),
  update: (id, body) => send(`/transactions/${encodeURIComponent(id)}`, { method: "PUT", body }),
  remove: id => send(`/transactions/${encodeURIComponent(id)}`, { method: "DELETE" }),
  endRecurrence: id => send(`/transactions/recurrences/${encodeURIComponent(id)}/end`, { method: "POST" })
};

function toQuery(values) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export { send as api };

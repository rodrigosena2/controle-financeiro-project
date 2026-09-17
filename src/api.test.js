import { authApi, transactionsApi, ApiError } from "./api";

const response = (status, body) => Promise.resolve({
  ok: status >= 200 && status < 300, status,
  json: () => Promise.resolve(body)
});

beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => { delete global.fetch; });

test("recupera sessão enviando cookie e sem CSRF em GET", async () => {
  fetch.mockReturnValueOnce(response(200, { id: "a" }));
  await authApi.me();
  expect(fetch).toHaveBeenCalledWith("/api/auth/me", expect.objectContaining({ credentials: "include" }));
  expect(fetch).toHaveBeenCalledTimes(1);
});

test("obtém CSRF e envia o token em toda operação de escrita", async () => {
  fetch.mockReturnValueOnce(response(200, { token: "csrf-token" }))
    .mockReturnValueOnce(response(201, { id: "1" }));
  await transactionsApi.create({ description: "Salário" });
  expect(fetch.mock.calls[0][0]).toBe("/api/auth/csrf");
  expect(fetch.mock.calls[1][1].headers["X-CSRF-TOKEN"]).toBe("csrf-token");
  expect(fetch.mock.calls[1][1].credentials).toBe("include");
});

test("preserva status e mensagem Problem Details da API", async () => {
  fetch.mockReturnValueOnce(response(401, { title: "Não autorizado" }));
  await expect(authApi.me()).rejects.toMatchObject({ name: "ApiError", status: 401, message: "Não autorizado" });
});

test("distingue indisponibilidade de uma resposta da API", async () => {
  fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  await expect(authApi.me()).rejects.toEqual(expect.objectContaining({
    name: "ApiError", status: 0, message: expect.stringContaining("conectar à API")
  }));
  expect(ApiError).toBeDefined();
});

test.each([
  [400, "Confira os dados"],
  [401, "sessão expirou"],
  [403, "não tem permissão"],
  [404, "Registro não encontrado"],
  [500, "servidor não conseguiu"]
])("status %s com corpo vazio recebe mensagem útil", async (status, message) => {
  fetch.mockResolvedValueOnce({ ok: false, status, json: () => Promise.reject(new SyntaxError()) });
  await expect(transactionsApi.list()).rejects.toMatchObject({
    status, message: expect.stringContaining(message)
  });
});

test("exibe mensagens de ValidationProblemDetails e preserva o status", async () => {
  fetch.mockReturnValueOnce(response(200, { token: "token" }))
    .mockReturnValueOnce(response(400, { errors: { Description: ["Descrição inválida."], Amount: ["Valor inválido."] } }));
  await expect(transactionsApi.create({})).rejects.toMatchObject({
    status: 400, message: "Descrição inválida. Valor inválido."
  });
});

test("não mostra detalhes internos de erro 500", async () => {
  fetch.mockReturnValueOnce(response(500, { detail: "SQL exception: connection secrets" }));
  await expect(transactionsApi.list()).rejects.toMatchObject({
    status: 500, message: expect.not.stringContaining("secrets")
  });
});

test.each([
  ["register", () => authApi.register({ email: "a@example.test" }), "/api/auth/register", "POST"],
  ["login", () => authApi.login({ email: "a@example.test" }), "/api/auth/login", "POST"],
  ["logout", () => authApi.logout(), "/api/auth/logout", "POST"],
  ["update", () => transactionsApi.update("123", { amount: 12 }), "/api/transactions/123", "PUT"],
  ["delete", () => transactionsApi.remove("123"), "/api/transactions/123", "DELETE"]
])("%s mantém cookies e CSRF nos contratos existentes", async (_, operation, path, method) => {
  fetch.mockReturnValueOnce(response(200, { token: "new-token" })).mockReturnValueOnce(response(204));
  await expect(operation()).resolves.toBeNull();
  expect(fetch).toHaveBeenLastCalledWith(path, expect.objectContaining({
    method, credentials: "include", cache: "no-store",
    headers: expect.objectContaining({ "X-CSRF-TOKEN": "new-token" })
  }));
});

test("CSRF é renovado após mudança de sessão e não vai para localStorage", async () => {
  fetch.mockReturnValueOnce(response(200, { token: "before-login" }))
    .mockReturnValueOnce(response(200, { id: "a" }))
    .mockReturnValueOnce(response(200, { token: "after-login" }))
    .mockReturnValueOnce(response(201, { id: "1" }));
  await authApi.login({ email: "a@example.test", password: "Senha!123456" });
  await transactionsApi.create({ amount: 1 });
  expect(fetch.mock.calls[1][1].headers["X-CSRF-TOKEN"]).toBe("before-login");
  expect(fetch.mock.calls[3][1].headers["X-CSRF-TOKEN"]).toBe("after-login");
  expect(localStorage.length).toBe(0);
});

test("falha ao obter CSRF impede enviar a mutação", async () => {
  fetch.mockReturnValueOnce(response(403, {}));
  await expect(transactionsApi.remove("123")).rejects.toMatchObject({ status: 403 });
  expect(fetch).toHaveBeenCalledTimes(1);
});

test("token CSRF ausente impede enviar a mutação", async () => {
  fetch.mockReturnValueOnce(response(200, {}));
  await expect(transactionsApi.remove("123")).rejects.toMatchObject({ kind: "protocol" });
  expect(fetch).toHaveBeenCalledTimes(1);
});

test("JSON inválido tem erro explícito de protocolo", async () => {
  fetch.mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.reject(new SyntaxError()) });
  await expect(transactionsApi.list()).rejects.toMatchObject({ status: 200, kind: "protocol" });
});

test("escrita com conexão perdida não é reenviada automaticamente", async () => {
  fetch.mockReturnValueOnce(response(200, { token: "token" }))
    .mockRejectedValueOnce(new TypeError("Network error"));
  await expect(transactionsApi.create({})).rejects.toMatchObject({ status: 0, kind: "network" });
  expect(fetch).toHaveBeenCalledTimes(2);
});

test("uma solicitação travada é encerrada com mensagem de timeout", async () => {
  jest.useFakeTimers();
  try {
    fetch.mockImplementation((_, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(new Error("aborted")));
    }));
    const pending = authApi.me();
    jest.advanceTimersByTime(15000);
    await expect(pending).rejects.toMatchObject({
      status: 0, message: expect.stringContaining("demorou para responder")
    });
  } finally { jest.useRealTimers(); }
});

test("serializa filtros e paginação sem valores vazios", async () => {
  fetch.mockReturnValueOnce(response(200, { items: [] }));
  await transactionsApi.list({ from: "2026-09-01", type: "Expense", category: "", page: 2, pageSize: 10 });
  expect(fetch).toHaveBeenCalledWith(
    "/api/transactions?from=2026-09-01&type=Expense&page=2&pageSize=10",
    expect.objectContaining({ method: "GET", credentials: "include" })
  );
});

test("consulta resumo e catálogo e encerra recorrência com CSRF", async () => {
  fetch.mockReturnValueOnce(response(200, { balance: 10 }))
    .mockReturnValueOnce(response(200, { income: [], expense: [] }))
    .mockReturnValueOnce(response(200, { token: "csrf" }))
    .mockReturnValueOnce(response(204));
  await transactionsApi.summary({ from: "2026-09-01", to: "2026-09-30" });
  await transactionsApi.categories();
  await transactionsApi.endRecurrence("abc");
  expect(fetch.mock.calls[0][0]).toBe("/api/transactions/summary?from=2026-09-01&to=2026-09-30");
  expect(fetch.mock.calls[1][0]).toBe("/api/transactions/categories");
  expect(fetch.mock.calls[3][0]).toBe("/api/transactions/recurrences/abc/end");
  expect(fetch.mock.calls[3][1].headers["X-CSRF-TOKEN"]).toBe("csrf");
});

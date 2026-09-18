import { authApi, transactionsApi, ApiError } from "./api";
import { auth as mockAuth } from "./firebaseClient";
import {
  createUserWithEmailAndPassword as mockCreateUser,
  signInWithEmailAndPassword as mockLogin,
  signOut as mockSignOut,
  updateProfile as mockUpdateProfile
} from "firebase/auth";
import {
  getDoc as mockGetDoc,
  getDocs as mockGetDocs,
  updateDoc as mockUpdateDoc,
  deleteDoc as mockDeleteDoc,
  writeBatch as mockWriteBatch,
  runTransaction as mockRunTransaction,
  __resetAutoId as resetAutoId
} from "firebase/firestore/lite";

jest.mock("./firebaseClient", () => ({
  auth: { currentUser: null, authStateReady: jest.fn() },
  db: { name: "test-db" },
  authPersistenceReady: Promise.resolve()
}));

jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn()
}));

jest.mock("firebase/firestore/lite", () => {
  let autoId = 0;
  return {
    collection: (_, ...segments) => ({ kind: "collection", path: segments.join("/") }),
    doc: (first, ...segments) => {
      if (first?.kind === "collection") {
        const id = segments[0] || `auto-${++autoId}`;
        return { kind: "document", id, path: `${first.path}/${id}` };
      }
      const id = segments[segments.length - 1];
      return { kind: "document", id, path: segments.join("/") };
    },
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    writeBatch: jest.fn(),
    runTransaction: jest.fn(),
    query: (reference, ...constraints) => ({ kind: "query", path: reference.path, constraints }),
    where: (...args) => ({ kind: "where", args }),
    orderBy: (...args) => ({ kind: "orderBy", args }),
    serverTimestamp: () => ({ serverTimestamp: true }),
    __resetAutoId: () => { autoId = 0; }
  };
});

let mockBatch;
let userSequence = 0;

const documentSnapshot = (id, value, path = `documents/${id}`) => ({
  id,
  ref: { kind: "document", id, path },
  exists: () => value !== undefined,
  data: () => value
});
const querySnapshot = values => ({ docs: values.map(([id, value]) => documentSnapshot(id, value)) });
const transaction = (uid, overrides = {}) => ({
  userId: uid,
  description: "Salário",
  amountCents: 100000,
  type: "Income",
  category: "Salary",
  date: "2026-09-10",
  createdAt: null,
  updatedAt: null,
  recurrenceId: null,
  recurrenceFrequency: null,
  ...overrides
});

beforeEach(() => {
  jest.clearAllMocks();
  resetAutoId();
  mockAuth.currentUser = { uid: `user-${++userSequence}`, email: "a@example.test", displayName: "Conta A" };
  mockAuth.authStateReady.mockResolvedValue();
  mockSignOut.mockResolvedValue();
  mockUpdateProfile.mockResolvedValue();
  mockUpdateDoc.mockResolvedValue();
  mockDeleteDoc.mockResolvedValue();
  mockBatch = { set: jest.fn(), update: jest.fn(), commit: jest.fn().mockResolvedValue() };
  mockWriteBatch.mockReturnValue(mockBatch);
  mockRunTransaction.mockImplementation(async (_, operation) => operation({
    get: reference => mockGetDoc(reference),
    set: mockBatch.set,
    update: mockBatch.update
  }));
  mockGetDocs.mockResolvedValue(querySnapshot([]));
});

test("recupera a sessão persistida pelo Firebase", async () => {
  await expect(authApi.me()).resolves.toEqual({
    id: mockAuth.currentUser.uid, email: "a@example.test", displayName: "Conta A"
  });
  expect(mockAuth.authStateReady).toHaveBeenCalled();
});

test("endpoint lógico protegido recusa usuário sem sessão", async () => {
  mockAuth.currentUser = null;
  await expect(authApi.me()).rejects.toMatchObject({ name: "ApiError", status: 401 });
  expect(ApiError).toBeDefined();
});

test("cadastra usuário e grava o nome no perfil", async () => {
  const user = { uid: "new-user", email: "new@example.test", displayName: null };
  mockCreateUser.mockResolvedValue({ user });
  mockUpdateProfile.mockImplementation(async (_, profile) => { user.displayName = profile.displayName; });
  await expect(authApi.register({
    email: "new@example.test", displayName: "Nova Conta", password: "Senha!Segura123"
  })).resolves.toMatchObject({ id: "new-user", displayName: "Nova Conta" });
  expect(mockCreateUser).toHaveBeenCalledWith(mockAuth, "new@example.test", "Senha!Segura123");
  expect(mockUpdateProfile).toHaveBeenCalledWith(user, { displayName: "Nova Conta" });
});

test("mantém a política forte de senha antes de chamar o Firebase", async () => {
  await expect(authApi.register({ email: "a@example.test", displayName: "Conta", password: "fraca" }))
    .rejects.toMatchObject({ status: 400, kind: "validation" });
  expect(mockCreateUser).not.toHaveBeenCalled();
});

test("cadastro duplicado recebe mensagem segura", async () => {
  mockCreateUser.mockRejectedValue({ code: "auth/email-already-in-use" });
  await expect(authApi.register({
    email: "a@example.test", displayName: "Conta A", password: "Senha!Segura123"
  })).rejects.toMatchObject({ status: 400, message: expect.not.stringContaining("already") });
});

test("login incorreto e logout usam Firebase Authentication", async () => {
  mockLogin.mockRejectedValueOnce({ code: "auth/invalid-credential" });
  await expect(authApi.login({ email: "a@example.test", password: "errada" }))
    .rejects.toMatchObject({ status: 401, message: "E-mail ou senha inválidos." });
  await expect(authApi.logout()).resolves.toBeNull();
  expect(mockSignOut).toHaveBeenCalledWith(mockAuth);
});

test("filtra, ordena e pagina somente documentos da conta autenticada", async () => {
  const uid = mockAuth.currentUser.uid;
  const values = [
    ["income", transaction(uid)],
    ["food", transaction(uid, { description: "Mercado", amountCents: 30000, type: "Expense", category: "Food", date: "2026-09-11" })],
    ["rent", transaction(uid, { description: "Moradia", amountCents: 80000, type: "Expense", category: "Housing", date: "2026-09-12" })]
  ];
  mockGetDocs.mockImplementation(async reference => reference.path.endsWith("/transactions")
    ? querySnapshot(values) : querySnapshot([]));

  const result = await transactionsApi.list({
    from: "2026-09-01", to: "2026-09-30", type: "Expense",
    search: "a", sortBy: "Amount", sortDirection: "Desc", page: 1, pageSize: 1
  });

  expect(result).toMatchObject({ page: 1, pageSize: 1, totalItems: 2, totalPages: 2 });
  expect(result.items[0]).toMatchObject({ id: "rent", userId: uid, amount: 800, type: "Expense" });
  expect(mockGetDocs.mock.calls.some(([reference]) => reference.path === `users/${uid}/transactions`)).toBe(true);
});

test("calcula o resumo em centavos sem erro de ponto flutuante", async () => {
  const uid = mockAuth.currentUser.uid;
  mockGetDocs.mockImplementation(async reference => reference.path.endsWith("/transactions")
    ? querySnapshot([
      ["one", transaction(uid, { amountCents: 10 })],
      ["two", transaction(uid, { amountCents: 20 })],
      ["expense", transaction(uid, { amountCents: 5, type: "Expense", category: "Food" })]
    ]) : querySnapshot([]));
  await expect(transactionsApi.summary({ from: "2026-09-01", to: "2026-09-30" }))
    .resolves.toMatchObject({ income: 0.3, expense: 0.05, balance: 0.25 });
});

test("cria transação no caminho do UID e persiste o valor em centavos", async () => {
  const uid = mockAuth.currentUser.uid;
  mockGetDoc.mockImplementation(async reference => {
    const written = mockBatch.set.mock.calls.find(([item]) => item.path === reference.path)?.[1];
    return documentSnapshot(reference.id, written, reference.path);
  });
  await transactionsApi.create({
    description: "Freelance", amount: 125.35, type: "Income", category: "Freelance", date: "2026-09-17"
  });
  const [reference, value] = mockBatch.set.mock.calls[0];
  expect(reference.path).toBe(`users/${uid}/transactions/auto-1`);
  expect(value).toMatchObject({ userId: uid, amountCents: 12535, recurrenceId: null });
  expect(mockBatch.commit).toHaveBeenCalled();
});

test("recorrência mensal usa identificador determinístico e trata fim do mês", async () => {
  const uid = mockAuth.currentUser.uid;
  mockGetDoc.mockImplementation(async reference => {
    const written = mockBatch.set.mock.calls.find(([item]) => item.path === reference.path)?.[1];
    return documentSnapshot(reference.id, written, reference.path);
  });
  await transactionsApi.create({
    description: "Mensalidade", amount: 90, type: "Expense", category: "Education",
    date: "2026-01-31", recurrenceFrequency: "Monthly"
  });
  const recurrenceWrite = mockBatch.set.mock.calls.find(([reference]) => reference.path.includes("/recurrences/"));
  const transactionWrite = mockBatch.set.mock.calls.find(([reference]) => reference.path.includes("/transactions/"));
  expect(recurrenceWrite[0].path).toBe(`users/${uid}/recurrences/auto-1`);
  expect(recurrenceWrite[1]).toMatchObject({ nextOccurrenceDate: "2026-02-28", frequency: "Monthly" });
  expect(transactionWrite[0].path).toBe(`users/${uid}/transactions/auto-1_20260131`);
});

test("materializa ocorrências vencidas uma vez e avança a série em transação atômica", async () => {
  const uid = mockAuth.currentUser.uid;
  const recurrence = {
    userId: uid,
    description: "Internet",
    amountCents: 12000,
    type: "Expense",
    category: "Subscriptions",
    frequency: "Weekly",
    startDate: "2026-08-25",
    nextOccurrenceDate: "2026-09-01",
    active: true,
    createdAt: null,
    updatedAt: null
  };
  mockGetDocs.mockImplementation(async reference => reference.path.endsWith("/recurrences")
    ? querySnapshot([["internet-series", recurrence]]) : querySnapshot([]));
  mockGetDoc.mockResolvedValue(documentSnapshot("internet-series", recurrence));

  await transactionsApi.list({ from: "2026-09-01", to: "2026-09-30" });
  await transactionsApi.list({ from: "2026-09-01", to: "2026-09-30" });

  expect(mockRunTransaction).toHaveBeenCalledTimes(1);
  expect(mockBatch.set).toHaveBeenCalledTimes(3);
  expect(mockBatch.set.mock.calls.map(([reference]) => reference.path)).toEqual([
    `users/${uid}/transactions/internet-series_20260901`,
    `users/${uid}/transactions/internet-series_20260908`,
    `users/${uid}/transactions/internet-series_20260915`
  ]);
  expect(mockBatch.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
    nextOccurrenceDate: "2026-09-22"
  }));
});

test("edição e exclusão nunca aceitam caminho de outro usuário", async () => {
  const uid = mockAuth.currentUser.uid;
  mockGetDoc.mockImplementation(async reference => documentSnapshot(reference.id,
    transaction(uid), reference.path));
  await transactionsApi.update("id-from-user-b", {
    description: "Atualizada", amount: 10, type: "Income", category: "Salary", date: "2026-09-17"
  });
  await transactionsApi.remove("id-from-user-b");
  expect(mockGetDoc).toHaveBeenCalledWith(expect.objectContaining({
    path: `users/${uid}/transactions/id-from-user-b`
  }));
  expect(mockUpdateDoc).toHaveBeenCalledWith(expect.objectContaining({
    path: `users/${uid}/transactions/id-from-user-b`
  }), expect.objectContaining({ amountCents: 1000 }));
  expect(mockDeleteDoc).toHaveBeenCalledWith(expect.objectContaining({
    path: `users/${uid}/transactions/id-from-user-b`
  }));
});

test("nega erro de permissão sem expor detalhes internos", async () => {
  mockGetDocs.mockRejectedValue({ code: "permission-denied", message: "internal rule path" });
  await expect(transactionsApi.list()).rejects.toMatchObject({
    status: 403,
    kind: "authorization",
    firebaseCode: "permission-denied",
    operation: "recurrences.list",
    path: expect.stringMatching(/^users\/user-\d+\/recurrences$/),
    originalMessage: "internal rule path",
    message: expect.not.stringContaining("internal")
  });
});

test("diferencia índice ausente de falha de autorização", async () => {
  mockGetDocs.mockImplementation(async reference => {
    if (reference.path.endsWith("/recurrences")) return querySnapshot([]);
    throw Object.assign(new Error("The query requires an index."), { code: "failed-precondition" });
  });
  await expect(transactionsApi.list()).rejects.toMatchObject({
    status: 409,
    kind: "configuration",
    firebaseCode: "failed-precondition",
    operation: "transactions.list",
    message: expect.stringContaining("índice")
  });
});

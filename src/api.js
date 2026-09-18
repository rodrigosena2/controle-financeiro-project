import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query as firestoreQuery,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore/lite";
import { auth, authPersistenceReady, db } from "./firebaseClient";

export class ApiError extends Error {
  constructor(message, status = 0, kind = "firebase", details = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.kind = kind;
    this.firebaseCode = details.firebaseCode || null;
    this.operation = details.operation || null;
    this.path = details.path || null;
    this.originalMessage = details.originalMessage || null;
  }
}

const categories = {
  income: [
    { value: "Salary", label: "Salário" },
    { value: "Freelance", label: "Freelance" },
    { value: "Investments", label: "Investimentos" },
    { value: "OtherIncome", label: "Outros" }
  ],
  expense: [
    { value: "Food", label: "Alimentação" },
    { value: "Housing", label: "Moradia" },
    { value: "Transportation", label: "Transporte" },
    { value: "Health", label: "Saúde" },
    { value: "Education", label: "Educação" },
    { value: "Leisure", label: "Lazer" },
    { value: "Subscriptions", label: "Assinaturas" },
    { value: "OtherExpense", label: "Outros" }
  ]
};

const categoryValues = {
  Income: new Set(categories.income.map(item => item.value)),
  Expense: new Set(categories.expense.map(item => item.value))
};
const recurrenceValues = new Set(["Weekly", "Monthly"]);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const periodCache = new Map();
const materializedAt = new Map();
const FIREBASE_READY_TIMEOUT_MS = 10000;
const FIREBASE_OPERATION_TIMEOUT_MS = 15000;

function waitForFirebaseReady(promise, message = "Não foi possível conectar ao Firebase. Verifique sua conexão e tente novamente.", timeout = FIREBASE_READY_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new ApiError(message, 0, "network"));
    }, timeout);
    Promise.resolve(promise).then(value => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    }, error => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
  });
}

function mapFirebaseError(error, context = {}) {
  if (error instanceof ApiError) return error;
  const code = error?.code || "";
  const details = {
    firebaseCode: code || null,
    operation: context.operation || null,
    path: context.path || null,
    originalMessage: error?.message || null
  };
  const authInvalid = new Set([
    "auth/invalid-credential", "auth/invalid-login-credentials", "auth/user-not-found",
    "auth/wrong-password", "auth/user-disabled"
  ]);
  if (authInvalid.has(code)) return new ApiError("E-mail ou senha inválidos.", 401, "authentication");
  if (code === "auth/email-already-in-use") {
    return new ApiError("Cadastro não realizado. Verifique o e-mail ou tente entrar.", 400, "validation");
  }
  if (["auth/invalid-email", "auth/weak-password", "auth/missing-password"].includes(code)) {
    return new ApiError("Verifique o e-mail e a política de senha.", 400, "validation");
  }
  if (code === "auth/too-many-requests" || code === "resource-exhausted") {
    return new ApiError("Muitas tentativas. Aguarde um minuto e tente novamente.", 429, "limit");
  }
  if (code === "permission-denied") {
    return new ApiError(
      "O Firestore recusou o acesso aos seus dados. Confirme se o banco existe e se as regras de segurança foram publicadas.",
      403,
      "authorization",
      details
    );
  }
  if (code === "unauthenticated") return new ApiError("Sua sessão expirou. Entre novamente para continuar.", 401, "authentication");
  if (code === "not-found") return new ApiError("Registro não encontrado. Atualize os dados e tente novamente.", 404);
  if (["already-exists", "aborted"].includes(code)) return new ApiError("Os dados foram alterados. Atualize a lista antes de continuar.", 409);
  if (code === "failed-precondition") {
    return new ApiError(
      "O Firestore exige uma configuração ou índice adicional para concluir esta consulta.",
      409,
      "configuration",
      details
    );
  }
  if (["invalid-argument", "out-of-range"].includes(code)) {
    return new ApiError("Confira os dados informados e tente novamente.", 400, "validation");
  }
  if (["auth/network-request-failed", "unavailable", "deadline-exceeded"].includes(code)) {
    return new ApiError("Não foi possível conectar ao Firebase. Verifique sua conexão.", 0, "network");
  }
  return new ApiError("O serviço não conseguiu concluir a solicitação. Tente novamente mais tarde.", 500);
}

async function firestoreCall(operation, path, uid, callback) {
  try {
    return await callback();
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.error("[Firestore] operação recusada", {
        operation,
        path,
        authUid: uid,
        firebaseCode: error?.code || null,
        firebaseMessage: error?.message || null
      });
    }
    throw mapFirebaseError(error, { operation, path });
  }
}

async function run(operation) {
  try {
    return await waitForFirebaseReady(
      operation(),
      "O Firebase não confirmou a operação. Verifique a conexão e tente novamente.",
      FIREBASE_OPERATION_TIMEOUT_MS
    );
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

function userResponse(user) {
  return {
    id: user.uid,
    email: user.email || "",
    displayName: user.displayName || user.email?.split("@")[0] || "Usuário"
  };
}

async function requireUser() {
  await waitForFirebaseReady(authPersistenceReady);
  if (typeof auth.authStateReady === "function") await waitForFirebaseReady(auth.authStateReady());
  if (!auth.currentUser?.uid || typeof auth.currentUser.uid !== "string") {
    throw new ApiError("Sua sessão expirou. Entre novamente para continuar.", 401, "authentication");
  }
  return auth.currentUser;
}

function validatePassword(password) {
  if (typeof password !== "string" || password.length < 12 || password.length > 128 ||
      !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)) {
    throw new ApiError("Use pelo menos 12 caracteres, incluindo maiúscula, minúscula, número e símbolo.", 400, "validation");
  }
}

function isValidDate(value) {
  if (typeof value !== "string" || !datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validatePeriod(from, to) {
  if (from && !isValidDate(from)) throw new ApiError("A data inicial é inválida.", 400, "validation");
  if (to && !isValidDate(to)) throw new ApiError("A data final é inválida.", 400, "validation");
  if (from && to && from > to) throw new ApiError("A data inicial deve ser anterior ou igual à data final.", 400, "validation");
}

function transactionInput(value, allowRecurrence) {
  const description = typeof value?.description === "string" ? value.description.trim() : "";
  const amount = Number(value?.amount);
  const amountCents = Math.round(amount * 100);
  if (description.length < 3 || description.length > 200) {
    throw new ApiError("A descrição deve possuir entre 3 e 200 caracteres.", 400, "validation");
  }
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(amountCents) ||
      Math.abs(amount * 100 - amountCents) > 0.000001) {
    throw new ApiError("O valor deve ser positivo e possuir no máximo duas casas decimais.", 400, "validation");
  }
  if (!categoryValues[value?.type]?.has(value?.category)) {
    throw new ApiError("A categoria não é compatível com o tipo da transação.", 400, "validation");
  }
  if (!isValidDate(value?.date)) throw new ApiError("A data da transação é inválida.", 400, "validation");
  const recurrenceFrequency = value?.recurrenceFrequency || null;
  if ((!allowRecurrence && recurrenceFrequency) || (recurrenceFrequency && !recurrenceValues.has(recurrenceFrequency))) {
    throw new ApiError("A recorrência deve ser semanal ou mensal.", 400, "validation");
  }
  return { description, amountCents, type: value.type, category: value.category, date: value.date, recurrenceFrequency };
}

function addOccurrence(date, frequency) {
  const [year, month, day] = date.split("-").map(Number);
  if (frequency === "Weekly") {
    const next = new Date(Date.UTC(year, month - 1, day + 7));
    return next.toISOString().slice(0, 10);
  }
  const targetMonth = month === 12 ? 1 : month + 1;
  const targetYear = month === 12 ? year + 1 : year;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

function today() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function timestampIso(value) {
  return typeof value?.toDate === "function" ? value.toDate().toISOString() : null;
}

function invalidate(uid) {
  for (const key of periodCache.keys()) if (key.startsWith(`${uid}|`)) periodCache.delete(key);
}

function transactionResponse(snapshot, recurrenceMap = new Map()) {
  const value = snapshot.data();
  const recurrence = value.recurrenceId ? recurrenceMap.get(value.recurrenceId) : null;
  return {
    id: snapshot.id,
    userId: value.userId,
    description: value.description,
    amount: value.amountCents / 100,
    type: value.type,
    category: value.category,
    date: value.date,
    createdAt: timestampIso(value.createdAt),
    updatedAt: timestampIso(value.updatedAt),
    recurrenceId: value.recurrenceId || null,
    recurrenceFrequency: value.recurrenceFrequency || null,
    isRecurrenceActive: Boolean(recurrence?.active),
    nextOccurrenceDate: recurrence?.nextOccurrenceDate || null
  };
}

function transactionDocument(uid, input, recurrenceId = null) {
  return {
    userId: uid,
    description: input.description,
    amountCents: input.amountCents,
    type: input.type,
    category: input.category,
    date: input.date,
    createdAt: serverTimestamp(),
    updatedAt: null,
    recurrenceId,
    recurrenceFrequency: recurrenceId ? input.recurrenceFrequency : null
  };
}

async function materializeDueOccurrences(uid) {
  const previous = materializedAt.get(uid) || 0;
  if (Date.now() - previous < 10000) return;
  const recurrenceCollection = collection(db, "users", uid, "recurrences");
  const recurrencePath = `users/${uid}/recurrences`;
  const snapshot = await firestoreCall("recurrences.list", recurrencePath, uid,
    () => getDocs(recurrenceCollection));
  const through = today();
  let changed = false;
  let backlog = false;

  for (const recurrenceSnapshot of snapshot.docs) {
    const result = await firestoreCall("recurrences.materialize", recurrencePath, uid,
      () => runTransaction(db, async transaction => {
      const currentSnapshot = await transaction.get(recurrenceSnapshot.ref);
      if (!currentSnapshot.exists()) return { changed: false, backlog: false };
      const recurrence = currentSnapshot.data();
      if (!recurrence.active || recurrence.nextOccurrenceDate > through) {
        return { changed: false, backlog: false };
      }
      let nextOccurrenceDate = recurrence.nextOccurrenceDate;
      let writes = 0;
      while (nextOccurrenceDate <= through && writes < 400) {
        const transactionRef = doc(
          db, "users", uid, "transactions",
          `${recurrenceSnapshot.id}_${nextOccurrenceDate.replaceAll("-", "")}`
        );
        transaction.set(transactionRef, transactionDocument(uid, {
          description: recurrence.description,
          amountCents: recurrence.amountCents,
          type: recurrence.type,
          category: recurrence.category,
          date: nextOccurrenceDate,
          recurrenceFrequency: recurrence.frequency
        }, recurrenceSnapshot.id));
        writes++;
        nextOccurrenceDate = addOccurrence(nextOccurrenceDate, recurrence.frequency);
      }
      transaction.update(recurrenceSnapshot.ref, { nextOccurrenceDate, updatedAt: serverTimestamp() });
      return { changed: true, backlog: nextOccurrenceDate <= through };
      }));
    changed ||= result.changed;
    backlog ||= result.backlog;
  }

  if (changed) invalidate(uid);
  if (!backlog) materializedAt.set(uid, Date.now());
}

async function loadPeriod(uid, from, to) {
  validatePeriod(from, to);
  const cacheKey = `${uid}|${from || ""}|${to || ""}`;
  const cached = periodCache.get(cacheKey);
  if (cached && Date.now() - cached.at < 5000) return cached.items;

  const constraints = [];
  if (from) constraints.push(where("date", ">=", from));
  if (to) constraints.push(where("date", "<=", to));
  constraints.push(orderBy("date", "desc"));
  const transactionPath = `users/${uid}/transactions`;
  const recurrencePath = `users/${uid}/recurrences`;
  const [transactionSnapshots, recurrenceSnapshots] = await Promise.all([
    firestoreCall("transactions.list", transactionPath, uid,
      () => getDocs(firestoreQuery(collection(db, "users", uid, "transactions"), ...constraints))),
    firestoreCall("recurrences.list", recurrencePath, uid,
      () => getDocs(collection(db, "users", uid, "recurrences")))
  ]);
  const recurrenceMap = new Map(recurrenceSnapshots.docs.map(item => [item.id, item.data()]));
  const items = transactionSnapshots.docs.map(item => transactionResponse(item, recurrenceMap));
  periodCache.set(cacheKey, { at: Date.now(), items });
  return items;
}

function compare(left, right, sortBy) {
  if (sortBy === "Amount") return left.amount - right.amount;
  if (sortBy === "Description") return left.description.localeCompare(right.description, "pt-BR", { sensitivity: "base" });
  return left.date.localeCompare(right.date);
}

async function existingTransaction(uid, id) {
  const reference = doc(db, "users", uid, "transactions", String(id));
  const path = `users/${uid}/transactions/${String(id)}`;
  const snapshot = await firestoreCall("transactions.get", path, uid, () => getDoc(reference));
  if (!snapshot.exists()) throw new ApiError("Transação não encontrada.", 404);
  return { reference, snapshot };
}

const firebaseAuthApi = {
  register: credentials => run(async () => {
    const displayName = typeof credentials?.displayName === "string" ? credentials.displayName.trim() : "";
    if (displayName.length < 2 || displayName.length > 100) throw new ApiError("Nome inválido.", 400, "validation");
    validatePassword(credentials?.password);
    await waitForFirebaseReady(authPersistenceReady);
    const result = await createUserWithEmailAndPassword(auth, credentials.email.trim(), credentials.password);
    await updateProfile(result.user, { displayName });
    return userResponse(result.user);
  }),
  login: credentials => run(async () => {
    await waitForFirebaseReady(authPersistenceReady);
    const result = await signInWithEmailAndPassword(auth, credentials.email.trim(), credentials.password);
    invalidate(result.user.uid);
    materializedAt.delete(result.user.uid);
    return userResponse(result.user);
  }),
  logout: () => run(async () => {
    const uid = auth.currentUser?.uid;
    await signOut(auth);
    if (uid) { invalidate(uid); materializedAt.delete(uid); }
    return null;
  }),
  me: () => run(async () => userResponse(await requireUser()))
};

const firebaseTransactionsApi = {
  categories: () => run(async () => {
    await requireUser();
    return categories;
  }),
  list: (filters = {}) => run(async () => {
    const user = await requireUser();
    validatePeriod(filters.from, filters.to);
    if (filters.type && !categoryValues[filters.type]) throw new ApiError("Tipo de transação inválido.", 400, "validation");
    if (filters.type && filters.category && !categoryValues[filters.type].has(filters.category)) {
      throw new ApiError("A categoria não é compatível com o tipo informado.", 400, "validation");
    }
    await materializeDueOccurrences(user.uid);
    let items = [...await loadPeriod(user.uid, filters.from, filters.to)];
    if (filters.type) items = items.filter(item => item.type === filters.type);
    if (filters.category) items = items.filter(item => item.category === filters.category);
    if (filters.search?.trim()) {
      const search = filters.search.trim().toLocaleLowerCase("pt-BR");
      items = items.filter(item => item.description.toLocaleLowerCase("pt-BR").includes(search));
    }
    const direction = filters.sortDirection === "Asc" ? 1 : -1;
    const sortBy = ["Date", "Amount", "Description"].includes(filters.sortBy) ? filters.sortBy : "Date";
    items.sort((left, right) => direction * compare(left, right, sortBy) ||
      String(right.createdAt || "").localeCompare(String(left.createdAt || "")) || right.id.localeCompare(left.id));
    const page = Math.max(1, Number.parseInt(filters.page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(filters.pageSize, 10) || 10));
    const totalItems = items.length;
    const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 0;
    return { items: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, totalItems, totalPages };
  }),
  summary: (filters = {}) => run(async () => {
    const user = await requireUser();
    await materializeDueOccurrences(user.uid);
    const items = await loadPeriod(user.uid, filters.from, filters.to);
    const incomeCents = items.filter(item => item.type === "Income").reduce((sum, item) => sum + Math.round(item.amount * 100), 0);
    const expenseCents = items.filter(item => item.type === "Expense").reduce((sum, item) => sum + Math.round(item.amount * 100), 0);
    return { from: filters.from || null, to: filters.to || null,
      income: incomeCents / 100, expense: expenseCents / 100, balance: (incomeCents - expenseCents) / 100 };
  }),
  create: body => run(async () => {
    const user = await requireUser();
    const input = transactionInput(body, true);
    const transactionCollection = collection(db, "users", user.uid, "transactions");
    const batch = writeBatch(db);
    let transactionRef;
    let recurrenceRef = null;
    let transactionValue;
    if (input.recurrenceFrequency) {
      recurrenceRef = doc(collection(db, "users", user.uid, "recurrences"));
      transactionRef = doc(transactionCollection, `${recurrenceRef.id}_${input.date.replaceAll("-", "")}`);
      batch.set(recurrenceRef, {
        userId: user.uid,
        description: input.description,
        amountCents: input.amountCents,
        type: input.type,
        category: input.category,
        frequency: input.recurrenceFrequency,
        startDate: input.date,
        nextOccurrenceDate: addOccurrence(input.date, input.recurrenceFrequency),
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: null
      });
    } else {
      transactionRef = doc(transactionCollection);
    }
    transactionValue = transactionDocument(user.uid, input, recurrenceRef?.id || null);
    batch.set(transactionRef, transactionValue);
    const transactionPath = `users/${user.uid}/transactions/${transactionRef.id}`;
    await firestoreCall("transactions.create", transactionPath, user.uid, () => batch.commit());
    invalidate(user.uid);
    if (recurrenceRef) materializedAt.delete(user.uid);
    const recurrenceMap = recurrenceRef ? new Map([[recurrenceRef.id, {
      active: true, nextOccurrenceDate: addOccurrence(input.date, input.recurrenceFrequency)
    }]]) : new Map();
    // The batch commit already confirms the write. Avoid an extra read here;
    // the background refresh will reconcile server timestamps and pagination.
    return transactionResponse({ id: transactionRef.id, data: () => transactionValue }, recurrenceMap);
  }),
  update: (id, body) => run(async () => {
    const user = await requireUser();
    const input = transactionInput(body, false);
    const { reference, snapshot } = await existingTransaction(user.uid, id);
    const transactionPath = `users/${user.uid}/transactions/${String(id)}`;
    await firestoreCall("transactions.update", transactionPath, user.uid, () => updateDoc(reference, {
        description: input.description,
        amountCents: input.amountCents,
        type: input.type,
        category: input.category,
        date: input.date,
        updatedAt: serverTimestamp()
      }));
    invalidate(user.uid);
    const recurrenceId = snapshot.data().recurrenceId;
    let recurrenceMap = new Map();
    if (recurrenceId) {
      const recurrencePath = `users/${user.uid}/recurrences/${recurrenceId}`;
      const recurrenceSnapshot = await firestoreCall("recurrences.get", recurrencePath, user.uid,
        () => getDoc(doc(db, "users", user.uid, "recurrences", recurrenceId)));
      if (recurrenceSnapshot.exists()) recurrenceMap = new Map([[recurrenceId, recurrenceSnapshot.data()]]);
    }
    const updatedSnapshot = await firestoreCall("transactions.get", transactionPath, user.uid,
      () => getDoc(reference));
    return transactionResponse(updatedSnapshot, recurrenceMap);
  }),
  remove: id => run(async () => {
    const user = await requireUser();
    const { reference } = await existingTransaction(user.uid, id);
    const transactionPath = `users/${user.uid}/transactions/${String(id)}`;
    await firestoreCall("transactions.delete", transactionPath, user.uid, () => deleteDoc(reference));
    invalidate(user.uid);
    return null;
  }),
  endRecurrence: id => run(async () => {
    const user = await requireUser();
    const reference = doc(db, "users", user.uid, "recurrences", String(id));
    const recurrencePath = `users/${user.uid}/recurrences/${String(id)}`;
    const snapshot = await firestoreCall("recurrences.get", recurrencePath, user.uid, () => getDoc(reference));
    if (!snapshot.exists()) throw new ApiError("Recorrência não encontrada.", 404);
    await firestoreCall("recurrences.end", recurrencePath, user.uid,
      () => updateDoc(reference, { active: false, updatedAt: serverTimestamp() }));
    invalidate(user.uid);
    materializedAt.delete(user.uid);
    return null;
  })
};

function withLocalTestAdapter(scope, implementation) {
  return Object.fromEntries(Object.entries(implementation).map(([method, operation]) => [
    method,
    (...args) => {
      const local = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
      const override = local ? window.__CONTROLE_FINANCEIRO_TEST_API__?.[scope]?.[method] : null;
      return typeof override === "function" ? override(...args) : operation(...args);
    }
  ]));
}

// This seam is restricted to localhost and supports the browser-only responsive suite.
// Production hosts always use Firebase, even if a global with this name is present.
export const authApi = withLocalTestAdapter("authApi", firebaseAuthApi);
export const transactionsApi = withLocalTestAdapter("transactionsApi", firebaseTransactionsApi);

const fs = require("node:fs");
const path = require("node:path");
const { after, before, beforeEach, test } = require("node:test");
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} = require("@firebase/rules-unit-testing");
const {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc
} = require("firebase/firestore");

const projectId = "controle-financeiro-rules-test";
let environment;

const transaction = userId => ({
  userId,
  description: "Salário",
  amountCents: 650000,
  type: "Income",
  category: "Salary",
  date: "2026-09-17",
  createdAt: serverTimestamp(),
  updatedAt: null,
  recurrenceId: null,
  recurrenceFrequency: null
});

const transactionRef = (database, userId, id = "transaction-a") =>
  doc(database, "users", userId, "transactions", id);

const recurrence = userId => ({
  userId,
  description: "Salário",
  amountCents: 650000,
  type: "Income",
  category: "Salary",
  frequency: "Monthly",
  startDate: "2026-09-17",
  nextOccurrenceDate: "2026-10-17",
  active: true,
  createdAt: serverTimestamp(),
  updatedAt: null
});

const recurrenceRef = (database, userId, id = "recurrence-a") =>
  doc(database, "users", userId, "recurrences", id);

before(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, "../firestore.rules"), "utf8")
    }
  });
});

beforeEach(async () => environment.clearFirestore());
after(async () => environment.cleanup());

test("User A cria e consulta seu próprio registro", async () => {
  const database = environment.authenticatedContext("user-a").firestore();
  const reference = transactionRef(database, "user-a");
  await assertSucceeds(setDoc(reference, transaction("user-a")));
  await assertSucceeds(getDoc(reference));
});

test("User B não consulta, altera ou exclui registro de User A", async () => {
  await environment.withSecurityRulesDisabled(async context => {
    await setDoc(transactionRef(context.firestore(), "user-a"), transaction("user-a"));
  });
  const databaseB = environment.authenticatedContext("user-b").firestore();
  const reference = transactionRef(databaseB, "user-a");
  await assertFails(getDoc(reference));
  await assertFails(updateDoc(reference, { description: "Ataque", updatedAt: serverTimestamp() }));
  await assertFails(deleteDoc(reference));
});

test("usuário não autenticado não acessa dados financeiros", async () => {
  const database = environment.unauthenticatedContext().firestore();
  await assertFails(getDoc(transactionRef(database, "user-a")));
  await assertFails(setDoc(transactionRef(database, "user-a"), transaction("user-a")));
});

test("não permite forjar o proprietário pelo conteúdo ou pelo caminho", async () => {
  const database = environment.authenticatedContext("user-b").firestore();
  await assertFails(setDoc(transactionRef(database, "user-a"), transaction("user-b")));
  await assertFails(setDoc(transactionRef(database, "user-b"), transaction("user-a")));
});

test("rejeita valor, categoria e campos inesperados", async () => {
  const database = environment.authenticatedContext("user-a").firestore();
  const reference = transactionRef(database, "user-a");
  await assertFails(setDoc(reference, { ...transaction("user-a"), amountCents: 0 }));
  await assertFails(setDoc(reference, { ...transaction("user-a"), category: "Food" }));
  await assertFails(setDoc(reference, { ...transaction("user-a"), admin: true }));
});

test("atualização preserva proprietário, criação e vínculo de recorrência", async () => {
  await environment.withSecurityRulesDisabled(async context => {
    await setDoc(transactionRef(context.firestore(), "user-a"), transaction("user-a"));
  });
  const database = environment.authenticatedContext("user-a").firestore();
  const reference = transactionRef(database, "user-a");
  await assertSucceeds(updateDoc(reference, {
    description: "Salário atualizado",
    amountCents: 700000,
    updatedAt: serverTimestamp()
  }));
  await assertFails(updateDoc(reference, { userId: "user-b", updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(reference, { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
});

test("User A cria, consulta e encerra sua própria recorrência", async () => {
  const database = environment.authenticatedContext("user-a").firestore();
  const reference = recurrenceRef(database, "user-a");
  await assertSucceeds(setDoc(reference, recurrence("user-a")));
  await assertSucceeds(getDoc(reference));
  await assertSucceeds(updateDoc(reference, {
    active: false,
    updatedAt: serverTimestamp()
  }));
});

test("User B não consulta nem altera recorrência de User A", async () => {
  await environment.withSecurityRulesDisabled(async context => {
    await setDoc(recurrenceRef(context.firestore(), "user-a"), recurrence("user-a"));
  });
  const databaseB = environment.authenticatedContext("user-b").firestore();
  const reference = recurrenceRef(databaseB, "user-a");
  await assertFails(getDoc(reference));
  await assertFails(updateDoc(reference, {
    active: false,
    updatedAt: serverTimestamp()
  }));
  await assertFails(deleteDoc(reference));
});

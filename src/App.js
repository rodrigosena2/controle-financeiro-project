import React, { useState, useEffect, useRef, useCallback } from "react";
import Form from "./components/Form/Form";
import Header from "./components/Header";
import Resume from "./components/Resume/Resume";
import GlobalStyle from "./styles/global";
import { authApi, transactionsApi } from "./api";
import { legacyNotice } from "./legacyTransactions";
import AuthForm from "./components/AuthForm";
import Feedback from "./components/Feedback";
import { Button, Eyebrow, Muted } from "./styles/ui";
import AppShell from "./components/AppShell";
import { FiCloud, FiPlus, FiShield } from "react-icons/fi";
import * as C from "./App.styles";

const iso = date => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const currentMonth = () => {
  const now = new Date();
  return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)) };
};
const initialQuery = () => ({ ...currentMonth(), type: "", category: "", search: "",
  sortBy: "Date", sortDirection: "Desc", page: 1, pageSize: 10 });
const emptyCatalog = { income: [], expense: [] };
const emptyPage = { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 };
const emptySummary = { income: 0, expense: 0, balance: 0 };
const initialTheme = () => {
  try {
    const stored = localStorage.getItem("controle-financeiro-theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch { /* Browsing can continue when storage is blocked. */ }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};
const periodLabel = query => {
  if (!query.from || !query.to) return "Período selecionado";
  const from = new Date(`${query.from}T12:00:00`);
  const to = new Date(`${query.to}T12:00:00`);
  const sameMonth = from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear();
  return sameMonth ? new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(from)
    : `${from.toLocaleDateString("pt-BR")} – ${to.toLocaleDateString("pt-BR")}`;
};

const displayRows = (rows, catalog) => {
  const labels = [...catalog.income, ...catalog.expense]
    .reduce((map, item) => ({ ...map, [item.value]: item.label }), {});
  return rows.map(row => ({
    id: row.id, desc: row.description, amount: row.amount, expense: row.type === "Expense",
    type: row.type, category: row.category, categoryLabel: labels[row.category] || row.category,
    date: row.date, recurrenceId: row.recurrenceId, recurrenceFrequency: row.recurrenceFrequency,
    isRecurrenceActive: row.isRecurrenceActive, nextOccurrenceDate: row.nextOccurrenceDate
  }));
};
const requestBody = transaction => ({
  description: transaction.desc.trim(), amount: Number(transaction.amount),
  type: transaction.expense ? "Expense" : "Income", category: transaction.category,
  date: transaction.date,
  ...(transaction.recurrenceFrequency ? { recurrenceFrequency: transaction.recurrenceFrequency } : {})
});

export default function App() {
  const [theme, setTheme] = useState(initialTheme);
  const [session, setSession] = useState(null);
  const sessionRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [catalog, setCatalog] = useState(emptyCatalog);
  const [summary, setSummary] = useState(emptySummary);
  const [paging, setPaging] = useState(emptyPage);
  const [query, setQuery] = useState(initialQuery);
  const queryRef = useRef(query);
  const [checking, setChecking] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [legacy, setLegacy] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const generation = useRef(0);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("controle-financeiro-theme", theme); }
    catch { /* Theme still works for the current session. */ }
  }, [theme]);

  const endSession = useCallback(message => {
    generation.current++;
    sessionRef.current = null;
    setSession(null); setRows([]); setCatalog(emptyCatalog); setSummary(emptySummary);
    setPaging(emptyPage); setDataReady(false); setChecking(false); setRefreshing(false);
    setLegacy(""); setSuccess(""); setComposerOpen(false); setError(message);
  }, []);

  const refresh = useCallback(async ({ afterWrite = false, queryOverride } = {}) => {
    const version = ++generation.current;
    let activeQuery = queryOverride || queryRef.current;
    if (queryOverride) { queryRef.current = queryOverride; setQuery(queryOverride); }
    setRefreshing(true); setError("");
    try {
      const user = await authApi.me();
      if (version !== generation.current) return false;
      if (sessionRef.current?.id !== user.id) {
        setRows([]); setDataReady(false); setSuccess("");
      }
      sessionRef.current = user; setSession(user);
      let list = await transactionsApi.list(activeQuery);
      if (version !== generation.current) return false;
      if (!list || !Array.isArray(list.items) || list.items.some(row => row.userId !== user.id))
        throw new Error("A conta ou a resposta mudou durante a consulta. Atualize os dados.");
      if (list.totalPages > 0 && list.page > list.totalPages) {
        activeQuery = { ...activeQuery, page: list.totalPages };
        queryRef.current = activeQuery; setQuery(activeQuery);
        list = await transactionsApi.list(activeQuery);
        if (version !== generation.current) return false;
        if (!list || !Array.isArray(list.items) || list.items.some(row => row.userId !== user.id))
          throw new Error("A conta ou a resposta mudou durante a consulta. Atualize os dados.");
      }
      const [periodSummary, categoryCatalog] = await Promise.all([
        transactionsApi.summary({ from: activeQuery.from, to: activeQuery.to }),
        transactionsApi.categories()
      ]);
      if (version !== generation.current) return false;
      if (!categoryCatalog || !Array.isArray(categoryCatalog.income) || !Array.isArray(categoryCatalog.expense))
        throw new Error("O serviço retornou um catálogo de categorias inválido.");
      setCatalog(categoryCatalog);
      setRows(displayRows(list.items, categoryCatalog));
      setPaging({ page: list.page, pageSize: list.pageSize, totalItems: list.totalItems, totalPages: list.totalPages });
      setSummary(periodSummary);
      setDataReady(true); setLegacy(legacyNotice());
      return true;
    } catch (e) {
      if (version !== generation.current) return false;
      setSuccess(""); setDataReady(false);
      if (e.status === 401) endSession(sessionRef.current ? "Sua sessão expirou. Entre novamente para continuar." : "");
      else setError((afterWrite ? "Alteração salva, mas não foi possível atualizar a lista. " : "") + e.message);
      return false;
    } finally {
      if (version === generation.current) { setChecking(false); setRefreshing(false); }
    }
  }, [endSession]);

  useEffect(() => {
    const requestGeneration = generation;
    const checkSession = () => { if (!busyRef.current) refresh(); };
    checkSession();
    window.addEventListener("focus", checkSession);
    const timer = setInterval(checkSession, 60000);
    return () => { requestGeneration.current++; clearInterval(timer); window.removeEventListener("focus", checkSession); };
  }, [refresh]);

  const beginAction = () => {
    if (busyRef.current) return false;
    busyRef.current = true; generation.current++; setBusy(true); setError(""); setSuccess("");
    return true;
  };
  const finishAction = () => { busyRef.current = false; setBusy(false); };

  const authenticate = async event => {
    event.preventDefault();
    if (!beginAction()) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const credentials = { email: data.get("email").trim(), password: data.get("password") };
    let registered = false;
    try {
      if (register) {
        await authApi.register({ ...credentials, displayName: data.get("displayName").trim() });
        registered = true; setRegister(false);
      }
      await authApi.login(credentials);
      form.elements.password.value = "";
      if (await refresh()) setSuccess(registered ? "Conta criada e sessão iniciada." : "Sessão iniciada com sucesso.");
    } catch (e) {
      setError((registered ? "Conta criada. Entre com suas credenciais para continuar. " : "") + e.message);
    } finally { finishAction(); }
  };

  const mutate = async (operation, message) => {
    if (!dataReady || !beginAction()) return false;
    try {
      await operation();
      if (await refresh({ afterWrite: true })) setSuccess(message);
      return true;
    } catch (e) {
      if (e.status === 401) endSession("Sua sessão expirou. Entre novamente para continuar.");
      else {
        const uncertain = !e.status || e.status >= 500 || e.kind === "protocol";
        setError(e.message + (uncertain ? " Não foi possível confirmar a alteração. Atualize a lista antes de tentar novamente." : ""));
        if (uncertain || e.status === 404) setDataReady(false);
      }
      return false;
    } finally { finishAction(); }
  };

  const logout = async () => {
    if (!beginAction()) return;
    try { await authApi.logout(); endSession(""); setSuccess("Sessão encerrada."); }
    catch (e) { if (e.status === 401) endSession("Sua sessão já estava encerrada."); else setError("Não foi possível confirmar a saída. " + e.message); }
    finally { setRefreshing(false); finishAction(); }
  };

  const toggleTheme = () => setTheme(value => value === "dark" ? "light" : "dark");
  const messages = <C.Messages>
    {error && <Feedback kind="error">{error}</Feedback>}
    {success && <Feedback kind="success">{success}</Feedback>}
    {checking && <Feedback kind="loading">Carregando sessão...</Feedback>}
    {!checking && (refreshing || busy) && <Feedback kind="loading">{refreshing ? "Atualizando dados..." : "Aguarde..."}</Feedback>}
    {!checking && error && <div><Button $variant="secondary" type="button" disabled={busy || refreshing} onClick={() => refresh()}>Atualizar dados</Button></div>}
  </C.Messages>;

  return <>
    <GlobalStyle />
    {session && !checking ? <AppShell user={session} theme={theme} onThemeToggle={toggleTheme}
      onLogout={logout} onNewTransaction={() => setComposerOpen(true)} busy={busy}
      newTransactionDisabled={busy || refreshing || !dataReady}
      periodLabel={periodLabel(query)}>
      <C.Main id="main-content" tabIndex={-1}>
        <C.Heading id="overview"><div><Eyebrow>Seu espaço financeiro</Eyebrow>
          <h1>Olá, {session.displayName} <span aria-hidden="true">👋</span></h1>
          <Muted>Aqui está seu panorama financeiro do período.</Muted></div>
          <C.NewButton><Button type="button" disabled={busy || refreshing || !dataReady}
            onClick={() => setComposerOpen(true)}><FiPlus aria-hidden="true" />Nova transação</Button></C.NewButton>
        </C.Heading>
        {messages}
        {legacy && <Feedback kind="warning">{legacy}</Feedback>}
        {dataReady && <Resume income={summary.income} expense={summary.expense} total={summary.balance} />}
        <Form key={session.id} transactionsList={dataReady ? rows : []} categories={catalog}
          filters={query} paging={paging} panelOpen={composerOpen}
          onPanelOpen={() => setComposerOpen(true)} onPanelClose={() => setComposerOpen(false)}
          disabled={busy || refreshing || !dataReady} showEmpty={dataReady && !refreshing}
          onFilters={next => refresh({ queryOverride: { ...next, page: 1 } })}
          onPage={page => refresh({ queryOverride: { ...queryRef.current, page } })}
          handleAdd={transaction => mutate(() => transactionsApi.create(requestBody(transaction)), "Transação criada com sucesso.")}
          onUpdate={(id, transaction) => mutate(() => transactionsApi.update(id, requestBody(transaction)), "Transação atualizada com sucesso.")}
          onDelete={id => mutate(() => transactionsApi.remove(id), "Transação excluída com sucesso.")}
          onEndRecurrence={id => mutate(() => transactionsApi.endRecurrence(id), "Recorrência encerrada com sucesso.")} />
        <C.Footer>Controle Financeiro · Mais clareza para suas escolhas.</C.Footer>
      </C.Main>
    </AppShell> : <>
      <Header theme={theme} onThemeToggle={toggleTheme} />
      <C.PublicMain id="main-content" tabIndex={-1}>
        {messages}
        {!checking && <C.AuthLayout>
          <C.Intro><div><Eyebrow>Finanças pessoais</Eyebrow>
            <h1>Mais do que controle.<br /><span>Clareza financeira.</span></h1>
            <Muted>Organize suas entradas e saídas e mantenha sua vida financeira acessível em qualquer dispositivo.</Muted></div>
            <C.IntroPoints><span><FiShield aria-hidden="true" />Dados por usuário</span>
              <span><FiCloud aria-hidden="true" />Persistência segura</span></C.IntroPoints>
          </C.Intro>
          <C.AuthColumn><AuthForm register={register} busy={busy} refreshing={refreshing} onSubmit={authenticate}
            onToggle={() => { setRegister(!register); setError(""); setSuccess(""); }} /></C.AuthColumn>
        </C.AuthLayout>}
      </C.PublicMain>
    </>}
  </>;
}

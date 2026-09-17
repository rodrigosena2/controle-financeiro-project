import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { authApi, transactionsApi } from "./api";

jest.mock("./api", () => ({
  authApi: { register: jest.fn(), login: jest.fn(), logout: jest.fn(), me: jest.fn() },
  transactionsApi: { list: jest.fn(), summary: jest.fn(), categories: jest.fn(), create: jest.fn(),
    update: jest.fn(), remove: jest.fn(), endRecurrence: jest.fn() }
}));

let rows;
let authenticated;
const apiError = (message, status = 0) => Object.assign(new Error(message), { status });

beforeEach(() => {
  rows = [];
  authenticated = true;
  jest.resetAllMocks();
  authApi.register.mockResolvedValue({ id: "a" });
  authApi.login.mockImplementation(async () => { authenticated = true; return { id: "a", displayName: "Conta A" }; });
  authApi.logout.mockImplementation(async () => { authenticated = false; });
  authApi.me.mockImplementation(async () => {
    if (!authenticated) throw apiError("Não autorizado", 401);
    return { id: "a", displayName: "Conta A" };
  });
  transactionsApi.list.mockImplementation(async () => ({ items: rows.map(row => ({
    userId: "a", category: row.category || (row.type === "Expense" ? "OtherExpense" : "OtherIncome"), ...row
  })), page: 1, pageSize: 10, totalItems: rows.length, totalPages: rows.length ? 1 : 0 }));
  transactionsApi.summary.mockImplementation(async () => {
    const income = rows.filter(row => row.type !== "Expense").reduce((sum, row) => sum + Number(row.amount), 0);
    const expense = rows.filter(row => row.type === "Expense").reduce((sum, row) => sum + Number(row.amount), 0);
    return { income, expense, balance: income - expense };
  });
  transactionsApi.categories.mockResolvedValue({
    income: [{ value: "Salary", label: "Salário" }, { value: "OtherIncome", label: "Outros" }],
    expense: [{ value: "Food", label: "Alimentação" }, { value: "OtherExpense", label: "Outros" }]
  });
  transactionsApi.create.mockImplementation(async body => {
    const row = { ...body, id: String(rows.length + 1) };
    rows.push(row);
    return row;
  });
  transactionsApi.update.mockImplementation(async (id, body) => {
    rows = rows.map(row => row.id === id ? { ...row, ...body } : row);
    return rows.find(row => row.id === id);
  });
  transactionsApi.remove.mockImplementation(async id => { rows = rows.filter(row => row.id !== id); });
  transactionsApi.endRecurrence.mockResolvedValue(null);
});

const ready = async () => {
  await screen.findByRole("button", { name: "Sair" });
  await waitFor(() => expect(screen.getAllByRole("button", { name: "Nova transação" })[0]).toBeEnabled());
};
const openTransaction = () => {
  if (!screen.queryByRole("dialog", { name: /transação/i }))
    fireEvent.click(screen.getAllByRole("button", { name: "Nova transação" })[0]);
};
const add = async (description, amount, expense = false) => {
  openTransaction();
  fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: description } });
  fireEvent.change(screen.getByLabelText("Valor"), { target: { value: amount } });
  if (expense) fireEvent.click(screen.getByLabelText("Saída"));
  fireEvent.click(screen.getByRole("button", { name: "ADICIONAR" }));
  expect(await screen.findByText(description, { selector: "h3" })).toBeInTheDocument();
  await waitFor(() => expect(screen.getAllByRole("button", { name: "Nova transação" })[0]).toBeEnabled());
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "Nova transação" })).not.toBeInTheDocument());
};

test("recupera sessão e apresenta lista vazia", async () => {
  render(<App />);
  await ready();
  expect(authApi.me).toHaveBeenCalled();
  expect(transactionsApi.list).toHaveBeenCalled();
  expect(screen.getByText("Nenhuma transação cadastrada.")).toBeInTheDocument();
});

test("cadastra, faz login e recupera os dados da conta", async () => {
  authenticated = false;
  rows = [{ id: "1", description: "Persistido", amount: 25, type: "Income", date: "2026-09-08" }];
  render(<App />);
  fireEvent.click(await screen.findByRole("button", { name: "Criar conta" }));
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Conta A" } });
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "a@example.test" } });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "Senha!Segura123" } });
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar e entrar" }));
  expect(await screen.findByText("Persistido")).toBeInTheDocument();
  expect(authApi.register).toHaveBeenCalled();
  expect(authApi.login).toHaveBeenCalled();
  expect(screen.getByRole("status")).toHaveTextContent("Conta criada");
});

test("cria entrada e saída e calcula o saldo com dados da API", async () => {
  render(<App />);
  await ready();
  await add("Salário", "1500");
  await add("Mercado", "425.50", true);
  expect(screen.getByTestId("summary-entradas")).toHaveTextContent("R$ 1.500,00");
  expect(screen.getByTestId("summary-saídas")).toHaveTextContent("R$ 425,50");
  expect(screen.getByTestId("summary-total")).toHaveTextContent("R$ 1.074,50");
});

test("edita e exclui uma transação", async () => {
  rows = [{ id: "1", description: "Internet", amount: 120, type: "Expense", date: "2026-09-08" }];
  render(<App />);
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "Editar Internet" }));
  fireEvent.change(screen.getByPlaceholderText("Ex: salário, luz..."), { target: { value: "Internet atualizada" } });
  fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "130" } });
  fireEvent.click(screen.getByRole("button", { name: "ATUALIZAR" }));
  expect(await screen.findByText("Internet atualizada")).toBeInTheDocument();
  expect(transactionsApi.update).toHaveBeenCalledWith("1", expect.objectContaining({ amount: 130 }));
  fireEvent.click(screen.getByRole("button", { name: "Excluir Internet atualizada" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
  await waitFor(() => expect(screen.queryByText("Internet atualizada")).not.toBeInTheDocument());
  expect(transactionsApi.remove).toHaveBeenCalledWith("1");
});

test("uma nova montagem recupera as transações persistidas", async () => {
  rows = [{ id: "1", description: "No SQL", amount: 99, type: "Income", date: "2026-09-08" }];
  const { unmount } = render(<App />);
  expect(await screen.findByText("No SQL")).toBeInTheDocument();
  unmount();
  render(<App />);
  expect(await screen.findByText("No SQL")).toBeInTheDocument();
  expect(transactionsApi.list).toHaveBeenCalledTimes(2);
});

test("logout remove dados da tela e novo login os recupera", async () => {
  rows = [{ id: "1", description: "Privado A", amount: 20, type: "Income", date: "2026-09-08" }];
  render(<App />);
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "Sair" }));
  const login = await screen.findByRole("button", { name: "Entrar" });
  expect(screen.queryByText("Privado A")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "a@example.test" } });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "Senha!Segura123" } });
  fireEvent.click(login);
  expect(await screen.findByText("Privado A")).toBeInTheDocument();
});

test("mostra erro amigável quando a API está indisponível", async () => {
  authApi.me.mockRejectedValueOnce(apiError("Não foi possível conectar à API. Verifique se o servidor está disponível."));
  render(<App />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar à API");
  expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
});

test("mantém a tela e mostra o erro devolvido ao criar", async () => {
  transactionsApi.create.mockRejectedValueOnce(apiError("Valor inválido.", 400));
  render(<App />);
  await ready();
  openTransaction();
  fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Falha API" } });
  fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "10" } });
  fireEvent.click(screen.getByRole("button", { name: "ADICIONAR" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Valor inválido");
  expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
});

test("sessão expirada remove dados privados e solicita novo login", async () => {
  transactionsApi.create.mockRejectedValueOnce(apiError("Não autorizado", 401));
  render(<App />);
  await ready();
  openTransaction();
  fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Expirada" } });
  fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "10" } });
  fireEvent.click(screen.getByRole("button", { name: "ADICIONAR" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("sessão expirou");
  expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
});

test("preserva o legado sem exibir nem enviar registros antigos", async () => {
  localStorage.setItem("transactions", JSON.stringify([{ desc: "Legado", amount: "15", expense: true }]));
  const original = localStorage.getItem("transactions");
  render(<App />);
  await ready();
  expect(screen.getByText(/A importação está desativada/)).toBeInTheDocument();
  expect(screen.queryByText("Legado")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Importar dados antigos" })).not.toBeInTheDocument();
  expect(transactionsApi.create).not.toHaveBeenCalled();
  expect(localStorage.getItem("transactions")).toBe(original);
});

test("sem autenticação não consulta transações", async () => {
  authenticated = false;
  render(<App />);
  await screen.findByRole("button", { name: "Entrar" });
  expect(transactionsApi.list).not.toHaveBeenCalled();
});

test("alterna e persiste o tema escolhido", async () => {
  authenticated = false;
  const view = render(<App />);
  const toggle = await screen.findByRole("button", { name: "Ativar tema escuro" });
  fireEvent.click(toggle);
  expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  expect(localStorage.getItem("controle-financeiro-theme")).toBe("dark");
  view.unmount();
  render(<App />);
  expect(await screen.findByRole("button", { name: "Ativar tema claro" })).toBeInTheDocument();
});

test("o saldo negativo continua correto e o legado não participa da soma", async () => {
  rows = [{ id: "1", description: "Internet", amount: 120.25, type: "Expense" }];
  localStorage.setItem("transactions", JSON.stringify([{ desc: "Antigo", amount: 900 }]));
  render(<App />);
  await ready();
  expect(screen.getByTestId("summary-total")).toHaveTextContent("-R$ 120,25");
});

test("cadastro confirmado não é repetido se o login seguinte falhar", async () => {
  authenticated = false;
  authApi.login.mockRejectedValueOnce(apiError("Muitas tentativas.", 429));
  render(<App />);
  fireEvent.click(await screen.findByRole("button", { name: "Criar conta" }));
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Conta A" } });
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "a@example.test" } });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "Senha!Segura123" } });
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar e entrar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Conta criada.");
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
  await ready();
  expect(authApi.register).toHaveBeenCalledTimes(1);
  expect(authApi.login).toHaveBeenLastCalledWith({ email: "a@example.test", password: "Senha!Segura123" });
});

test("falha ao listar não encerra sessão válida nem mostra falso vazio; permite recuperar", async () => {
  transactionsApi.list.mockRejectedValueOnce(apiError("API indisponível.", 503));
  render(<App />);
  expect(await screen.findByRole("alert")).toHaveTextContent("API indisponível");
  expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
  expect(screen.queryByText("Nenhuma transação cadastrada.")).not.toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "Nova transação" })[0]).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Atualizar dados" }));
  await screen.findByText("Nenhuma transação cadastrada.");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

const fillTransaction = (description = "Conta nova") => {
  openTransaction();
  fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: description } });
  fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "10" } });
};
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

test("escrita confirmada com falha no GET não é apresentada como sucesso completo nem reenviada", async () => {
  render(<App />);
  await ready();
  transactionsApi.list.mockRejectedValueOnce(apiError("Servidor indisponível.", 503));
  fillTransaction();
  fireEvent.click(screen.getByRole("button", { name: "ADICIONAR" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Alteração salva");
  expect(screen.queryByText("Transação criada com sucesso.")).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog", { name: "Nova transação" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Atualizar dados" }));
  await screen.findByText("Conta nova");
  expect(transactionsApi.create).toHaveBeenCalledTimes(1);
});

test("não permite clique duplo ou exclusão concorrente enquanto salva", async () => {
  const write = deferred();
  transactionsApi.create.mockReturnValueOnce(write.promise);
  render(<App />);
  await ready();
  fillTransaction();
  const submit = screen.getByRole("button", { name: "ADICIONAR" });
  fireEvent.click(submit);
  fireEvent.click(submit);
  expect(submit).toBeDisabled();
  expect(screen.getByRole("button", { name: "Sair" })).toBeDisabled();
  expect(transactionsApi.create).toHaveBeenCalledTimes(1);
  await act(async () => { write.resolve({ id: "1" }); });
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "Nova transação" })).not.toBeInTheDocument());
  expect(screen.getAllByRole("button", { name: "Nova transação" })[0]).toBeEnabled();
});

test("escrita com resposta perdida exige consulta antes de nova tentativa", async () => {
  transactionsApi.create.mockRejectedValueOnce(apiError("Conexão perdida."));
  render(<App />);
  await ready();
  fillTransaction();
  fireEvent.click(screen.getByRole("button", { name: "ADICIONAR" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível confirmar");
  expect(screen.getByRole("button", { name: "ADICIONAR" })).toBeDisabled();
  expect(transactionsApi.create).toHaveBeenCalledTimes(1);
});

test.each([403, 404, 500])("apresenta falha %s da API durante exclusão sem apagar o banco", async status => {
  rows = [{ id: "1", description: "Salário", amount: 10, type: "Income", date: "2026-09-08" }];
  transactionsApi.remove.mockRejectedValueOnce(apiError("Falha informada pela API.", status));
  render(<App />);
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "Excluir Salário" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Falha informada pela API");
  expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
  expect(rows).toHaveLength(1);
});

test("verificação de sessão ao focar preserva o formulário ainda não salvo", async () => {
  render(<App />);
  await ready();
  fillTransaction("Rascunho");
  await act(async () => { window.dispatchEvent(new Event("focus")); });
  await waitFor(() => expect(authApi.me).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.getByRole("button", { name: "ADICIONAR" })).toBeEnabled());
  expect(screen.getByLabelText("Descrição")).toHaveValue("Rascunho");
});

test("resposta antiga não restaura dados após logout", async () => {
  rows = [{ id: "1", description: "Privado A", amount: 20, type: "Income" }];
  render(<App />);
  await ready();
  const read = deferred();
  transactionsApi.list.mockReturnValueOnce(read.promise);
  fireEvent.focus(window);
  await waitFor(() => expect(transactionsApi.list).toHaveBeenCalledTimes(2));
  fireEvent.click(screen.getByRole("button", { name: "Sair" }));
  await screen.findByRole("button", { name: "Entrar" });
  await act(async () => { read.resolve({ items: [{ ...rows[0], userId: "a", category: "OtherIncome" }],
    page: 1, pageSize: 10, totalItems: 1, totalPages: 1 }); });
  expect(screen.queryByText("Privado A")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Sair" })).not.toBeInTheDocument();
});

test("troca da conta descarta rascunho e transações da conta anterior", async () => {
  rows = [{ id: "1", description: "Privado A", amount: 20, type: "Income" }];
  render(<App />);
  await ready();
  fillTransaction("Rascunho A");
  authApi.me.mockResolvedValue({ id: "b", displayName: "Conta B" });
  transactionsApi.list.mockResolvedValue({ items: [{ id: "2", userId: "b", description: "Privado B", amount: 5,
    type: "Income", category: "OtherIncome" }], page: 1, pageSize: 10, totalItems: 1, totalPages: 1 });
  fireEvent.focus(window);
  await screen.findByText("Privado B");
  expect(screen.queryByText("Privado A")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Descrição")).toHaveValue("");
});

test("não apresenta uma lista cuja conta difere da sessão consultada", async () => {
  transactionsApi.list.mockResolvedValue({ items: [{ id: "2", userId: "b", description: "Privado B" }],
    page: 1, pageSize: 10, totalItems: 1, totalPages: 1 });
  render(<App />);
  expect(await screen.findByRole("alert")).toHaveTextContent("A conta ou a resposta mudou");
  expect(screen.queryByText("Privado B")).not.toBeInTheDocument();
});

test("localStorage bloqueado não impede carregar dados do SQL", async () => {
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Bloqueado"); });
  rows = [{ id: "1", description: "No SQL", amount: 20, type: "Income" }];
  render(<App />);
  await screen.findByText("No SQL");
  expect(screen.getByText(/Não foi possível verificar os dados antigos/)).toBeInTheDocument();
});

test("exclusão pede confirmação, permite cancelar e devolve o foco", async () => {
  rows = [{ id: "1", description: "Internet", amount: 120, type: "Expense", date: "2026-09-08" }];
  render(<App />);
  await ready();
  const trigger = screen.getByRole("button", { name: "Excluir Internet" });
  trigger.focus();
  fireEvent.click(trigger);
  expect(screen.getByRole("dialog", { name: "Excluir transação?" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();
  expect(transactionsApi.remove).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  expect(rows).toHaveLength(1);
});

test("campos inválidos recebem mensagem associada e foco, sem chamar API", async () => {
  render(<App />);
  await ready();
  openTransaction();
  fireEvent.click(screen.getByRole("button", { name: "ADICIONAR" }));
  const description = screen.getByLabelText("Descrição");
  expect(description).toHaveFocus();
  expect(description).toHaveAttribute("aria-invalid", "true");
  expect(description).toHaveAccessibleDescription("Use pelo menos 3 caracteres para a descrição.");
  expect(screen.getByLabelText("Valor")).toHaveAttribute("aria-invalid", "true");
  expect(transactionsApi.create).not.toHaveBeenCalled();
});

test("login inválido recebe mensagens por campo", async () => {
  authenticated = false;
  render(<App />);
  fireEvent.click(await screen.findByRole("button", { name: "Entrar" }));
  expect(screen.getByLabelText("E-mail")).toHaveFocus();
  expect(screen.getByLabelText("E-mail")).toHaveAccessibleDescription("Informe um e-mail válido.");
  expect(screen.getByLabelText("Senha")).toHaveAccessibleDescription("Informe sua senha.");
  expect(authApi.login).not.toHaveBeenCalled();
});

test("edição foca a descrição e cancelar não altera registro", async () => {
  rows = [{ id: "1", description: "Internet", amount: 120, type: "Expense", date: "2026-09-08" }];
  render(<App />);
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "Editar Internet" }));
  expect(screen.getByLabelText("Descrição")).toHaveFocus();
  fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Outra descrição" } });
  fireEvent.click(screen.getByRole("button", { name: "Cancelar edição" }));
  expect(screen.queryByRole("dialog", { name: "Editar transação" })).not.toBeInTheDocument();
  expect(transactionsApi.update).not.toHaveBeenCalled();
  expect(screen.getByText("Internet")).toBeInTheDocument();
});

test("envia categoria e recorrência ao criar uma despesa mensal", async () => {
  render(<App />);
  await ready();
  openTransaction();
  fireEvent.click(screen.getByLabelText("Saída"));
  fireEvent.change(screen.getByLabelText("Categoria", { selector: "#transaction-category" }), { target: { value: "Food" } });
  fireEvent.change(screen.getByLabelText("Recorrência"), { target: { value: "Monthly" } });
  fillTransaction("Aluguel mensal");
  const submit = screen.getByRole("button", { name: "ADICIONAR" });
  await act(async () => { submit.click(); });
  await waitFor(() => expect(transactionsApi.create).toHaveBeenCalledWith(expect.objectContaining({
    type: "Expense", category: "Food", recurrenceFrequency: "Monthly"
  })));
  await screen.findByText("Transação criada com sucesso.");
  await waitFor(() => expect(screen.getAllByRole("button", { name: "Nova transação" })[0]).toBeEnabled());
});

test("aplica período, tipo, categoria, busca e ordenação combinados na API", async () => {
  render(<App />);
  await ready();
  fireEvent.change(screen.getByLabelText("Período"), { target: { value: "custom" } });
  fireEvent.change(screen.getByLabelText("Data inicial"), { target: { value: "2026-08-01" } });
  fireEvent.change(screen.getByLabelText("Data final"), { target: { value: "2026-08-31" } });
  fireEvent.change(screen.getByLabelText("Tipo", { selector: "#filter-type" }), { target: { value: "Expense" } });
  fireEvent.change(screen.getByLabelText("Categoria", { selector: "#filter-category" }), { target: { value: "Food" } });
  fireEvent.change(screen.getByLabelText("Buscar descrição"), { target: { value: "mercado" } });
  fireEvent.change(screen.getByLabelText("Ordenar por"), { target: { value: "Amount" } });
  fireEvent.change(screen.getByLabelText("Direção"), { target: { value: "Asc" } });
  fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
  await waitFor(() => expect(transactionsApi.list).toHaveBeenLastCalledWith(expect.objectContaining({
    from: "2026-08-01", to: "2026-08-31", type: "Expense", category: "Food",
    search: "mercado", sortBy: "Amount", sortDirection: "Asc", page: 1
  })));
});

test("usa resumo da API mesmo quando a lista contém somente uma página", async () => {
  rows = [{ id: "1", description: "Página", amount: 10, type: "Income", date: "2026-09-08" }];
  transactionsApi.summary.mockResolvedValue({ income: 1000, expense: 250, balance: 750 });
  render(<App />);
  await ready();
  expect(screen.getByTestId("summary-entradas")).toHaveTextContent("R$ 1.000,00");
  expect(screen.getByTestId("summary-saídas")).toHaveTextContent("R$ 250,00");
  expect(screen.getByTestId("summary-total")).toHaveTextContent("R$ 750,00");
});

test("navega entre páginas sem perder os filtros", async () => {
  transactionsApi.list.mockImplementation(async query => ({ items: [{ id: String(query.page), userId: "a",
    description: `Página ${query.page}`, amount: 10, type: "Income", category: "Salary", date: "2026-09-08" }],
    page: query.page, pageSize: 10, totalItems: 11, totalPages: 2 }));
  render(<App />);
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "Próxima" }));
  expect(await screen.findByText("Página 2", { selector: "h3" })).toBeInTheDocument();
  expect(transactionsApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
});

test("permite encerrar uma recorrência ativa", async () => {
  rows = [{ id: "1", description: "Internet", amount: 100, type: "Expense", category: "Subscriptions",
    date: "2026-09-08", recurrenceId: "series-1", recurrenceFrequency: "Monthly", isRecurrenceActive: true }];
  render(<App />);
  await ready();
  fireEvent.click(screen.getByRole("button", { name: "Encerrar recorrência de Internet" }));
  await waitFor(() => expect(transactionsApi.endRecurrence).toHaveBeenCalledWith("series-1"));
  await screen.findByText("Recorrência encerrada com sucesso.");
});

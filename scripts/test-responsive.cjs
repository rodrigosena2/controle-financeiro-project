// Browser-only UI regression. API is mocked; SQL/security regression remains in dotnet test.
// Use PLAYWRIGHT_MODULE to reuse an externally installed Playwright without adding a UI dependency.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const os = require("node:os");
const build = path.resolve(__dirname, "../build");
const output = path.resolve(__dirname, "../artifacts/ui");
const widths = [360, 390, 430, 768, 1024, 1440];
const results = [];
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const file = path.resolve(build, "." + (pathname === "/" ? "/index.html" : pathname));
  if (!file.startsWith(build + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end(); return;
  }
  res.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream");
  fs.createReadStream(file).pipe(res);
});
const fixtures = () => [
  { id: "1", userId: "a", description: "Salário", amount: 4580.75, type: "Income", category: "Salary", date: "2026-09-16" },
  { id: "2", userId: "a", description: "Compras do mês no supermercado", amount: 386.42, type: "Expense", category: "Food", date: "2026-09-15" },
  { id: "3", userId: "a", description: "Internet e telefone", amount: 119.90, type: "Expense", category: "Subscriptions", date: "2026-09-14" }
];

async function setup(page, authenticated = true) {
  const state = { authenticated, rows: fixtures(), offline: false, failWrites: false, deletes: 0 };
  await page.route("**/api/**", async route => {
    const request = route.request();
    const resource = new URL(request.url()).pathname;
    const method = request.method();
    const respond = (status, data) => route.fulfill({ status, contentType: "application/json", body: status === 204 ? "" : JSON.stringify(data) });
    if (state.offline) return route.abort("connectionfailed");
    if (resource.endsWith("/csrf")) return respond(200, { token: "test-csrf" });
    if (method !== "GET") assert.equal(request.headers()["x-csrf-token"], "test-csrf");
    if (resource.endsWith("/register")) return respond(201, { id: "a" });
    if (resource.endsWith("/login")) { state.authenticated = true; return respond(200, { id: "a" }); }
    if (!state.authenticated) return respond(401, {});
    if (resource.endsWith("/logout")) { state.authenticated = false; return respond(204); }
    if (resource.endsWith("/me")) return respond(200, { id: "a", displayName: "Marina" });
    if (resource.endsWith("/transactions/categories")) return respond(200, {
      income: [{ value: "Salary", label: "Salário" }, { value: "Freelance", label: "Freelance" },
        { value: "Investments", label: "Investimentos" }, { value: "OtherIncome", label: "Outros" }],
      expense: [{ value: "Food", label: "Alimentação" }, { value: "Housing", label: "Moradia" },
        { value: "Transportation", label: "Transporte" }, { value: "Health", label: "Saúde" },
        { value: "Education", label: "Educação" }, { value: "Leisure", label: "Lazer" },
        { value: "Subscriptions", label: "Assinaturas" }, { value: "OtherExpense", label: "Outros" }]
    });
    if (resource.endsWith("/transactions/summary")) {
      const income = state.rows.filter(row => row.type === "Income").reduce((sum, row) => sum + row.amount, 0);
      const expense = state.rows.filter(row => row.type === "Expense").reduce((sum, row) => sum + row.amount, 0);
      return respond(200, { income, expense, balance: income - expense });
    }
    if (method === "GET") return respond(200, { items: state.rows, page: 1, pageSize: 10,
      totalItems: state.rows.length, totalPages: state.rows.length ? 1 : 0 });
    if (state.failWrites) return respond(500, {});
    const body = method === "DELETE" ? null : request.postDataJSON();
    if (method === "POST") {
      const row = { ...body, id: String(Date.now()), userId: "a" };
      state.rows.push(row); return respond(201, row);
    }
    const id = resource.split("/").pop();
    if (method === "PUT") {
      state.rows = state.rows.map(row => row.id === id ? { ...row, ...body } : row);
      return respond(200, state.rows.find(row => row.id === id));
    }
    if (method === "DELETE") { state.deletes++; state.rows = state.rows.filter(row => row.id !== id); return respond(204); }
    return respond(404, {});
  });
  return state;
}

async function audit(page, name, width) {
  await page.evaluate(() => document.fonts.ready);
  const geometry = await page.evaluate(() => ({
    width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
    small: [...document.querySelectorAll("button, input:not([type=radio]), label:has(input[type=radio])")]
      .filter(el => el.getClientRects().length)
      .filter(el => { const r = el.getBoundingClientRect(); return r.width < 44 || r.height < 44; })
      .map(el => ({ text: el.textContent || el.id, width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })),
    overlaps: [...document.querySelectorAll("li button")].some((el, i, list) => {
      if (i % 2 || !list[i + 1]) return false;
      const a = el.getBoundingClientRect(), b = list[i + 1].getBoundingClientRect();
      return a.right > b.left + 1 && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
    })
  }));
  assert(geometry.scrollWidth <= geometry.width, name + ": horizontal overflow " + JSON.stringify(geometry));
  assert.deepEqual(geometry.small, [], name + ": small touch targets");
  assert.equal(geometry.overlaps, false, name + ": action overlap");
  await page.screenshot({ path: path.join(output, name + "-" + width + ".png"), fullPage: true });
  results.push({ scenario: name, width, ...geometry, passed: true });
}

async function main() {
  fs.mkdirSync(output, { recursive: true });
  await new Promise(resolve => server.listen(0, "0.0.0.0", resolve));
  const port = server.address().port;
  const base = "http://127.0.0.1:" + port;
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "chrome", headless: true });
  try {
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      const state = await setup(page);
      await page.goto(base);
      const newTransaction = width < 768
        ? page.getByRole("navigation", { name: "Navegação móvel" }).getByRole("button", { name: "Nova transação" })
        : page.locator("#overview").getByRole("button", { name: "Nova transação" });
      await newTransaction.waitFor();
      await page.getByRole("heading", { name: "Salário", exact: true }).waitFor();
      await audit(page, "dashboard", width);
      if (width === 390 || width === 1440) {
        await page.getByRole("button", { name: "Ativar tema escuro", exact: true }).click();
        await audit(page, "dashboard-dark", width);
        await page.getByRole("button", { name: "Ativar tema claro", exact: true }).click();
        await newTransaction.click();
        await page.getByRole("dialog", { name: "Nova transação", exact: true }).waitFor();
        await audit(page, "transaction-drawer", width);
        await page.getByRole("button", { name: "Fechar formulário", exact: true }).click();
      }
      // Stress cases: long strings, unusually large values and long account names.
      state.rows.push({ id: "long", userId: "a", description: "Lançamento " + "compridosemespacos".repeat(10),
        amount: 987654321.99, type: "Income", category: "OtherIncome", date: "2026-09-16" });
      await page.reload();
      await page.getByRole("button", { name: /^Editar Lançamento/ }).waitFor();
      await audit(page, "long-content", width);
      state.rows = [];
      await page.reload();
      await page.getByText("Nenhuma transação cadastrada.", { exact: true }).waitFor();
      await audit(page, "empty", width);
      await newTransaction.click();
      await page.getByRole("button", { name: "ADICIONAR", exact: true }).click();
      await page.getByText("Use pelo menos 3 caracteres para a descrição.").waitFor();
      assert.equal(await page.getByLabel("Descrição", { exact: true }).evaluate(el => el === document.activeElement), true);
      await audit(page, "validation", width);
      state.authenticated = false;
      await page.reload();
      await page.getByRole("button", { name: "Entrar", exact: true }).waitFor();
      await audit(page, "login", width);
      await page.getByRole("button", { name: "Criar conta", exact: true }).click();
      await audit(page, "register", width);
      assert.deepEqual(errors, []);
      await context.close();
    }

    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const state = await setup(page, false);
    await page.goto(base);
    await page.getByRole("button", { name: "Criar conta", exact: true }).click();
    await page.getByLabel("Nome", { exact: true }).fill("Marina");
    await page.getByLabel("E-mail", { exact: true }).fill("marina@example.test");
    await page.getByLabel("Senha", { exact: true }).fill("Senha!Segura123");
    await page.getByRole("button", { name: "Cadastrar e entrar" }).click();
    await page.getByRole("heading", { name: "Salário", exact: true }).waitFor();
    const mobileNewTransaction = page.getByRole("navigation", { name: "Navegação móvel" })
      .getByRole("button", { name: "Nova transação" });
    await mobileNewTransaction.click();
    await page.getByLabel("Descrição", { exact: true }).fill("Teste mobile");
    await page.getByLabel("Valor", { exact: true }).fill("125.50");
    await page.getByLabel("Saída", { exact: true }).check();
    await page.getByRole("button", { name: "ADICIONAR", exact: true }).click();
    await page.getByRole("button", { name: "Editar Teste mobile", exact: true }).click();
    assert.equal(await page.getByLabel("Descrição", { exact: true }).inputValue(), "Teste mobile");
    await page.getByLabel("Valor", { exact: true }).fill("130.25");
    await page.getByRole("button", { name: "ATUALIZAR", exact: true }).click();
    await page.getByText("Transação atualizada com sucesso.").waitFor();
    await page.reload();
    await page.getByRole("button", { name: "Excluir Teste mobile", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Excluir transação?" });
    await dialog.waitFor();
    await audit(page, "delete-dialog", 390);
    assert.equal(await dialog.getByRole("button", { name: "Cancelar", exact: true }).evaluate(el => el === document.activeElement), true);
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
      assert.equal(await page.evaluate(() => !!document.activeElement.closest("dialog")), true, "dialog must trap focus");
    }
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.equal(state.deletes, 0);
    assert.equal(await page.getByRole("button", { name: "Excluir Teste mobile", exact: true }).evaluate(el => el === document.activeElement), true);
    await page.getByRole("button", { name: "Excluir Teste mobile", exact: true }).click();
    await dialog.getByRole("button", { name: "Confirmar exclusão" }).click();
    await page.getByRole("button", { name: "Excluir Teste mobile", exact: true }).waitFor({ state: "hidden" });
    assert.equal(state.deletes, 1);
    await page.getByRole("button", { name: "Sair", exact: true }).click();
    await page.getByRole("button", { name: "Entrar", exact: true }).waitFor();
    await page.getByLabel("E-mail", { exact: true }).fill("marina@example.test");
    await page.getByLabel("Senha", { exact: true }).fill("Senha!Segura123");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.getByRole("heading", { name: "Salário", exact: true }).waitFor();
    state.failWrites = true;
    await mobileNewTransaction.click();
    await page.getByLabel("Descrição", { exact: true }).fill("Erro API");
    await page.getByLabel("Valor", { exact: true }).fill("10");
    await page.getByRole("button", { name: "ADICIONAR", exact: true }).click();
    await page.getByRole("alert").waitFor();
    await audit(page, "api-error", 390);
    state.failWrites = false;
    await page.getByRole("button", { name: "Fechar formulário", exact: true }).click();
    await page.getByRole("button", { name: "Atualizar dados" }).click();
    // The feedback message clears before the refresh request finishes; wait for
    // creation to become available again before simulating session expiration.
    await mobileNewTransaction.waitFor({ state: "visible" });
    await mobileNewTransaction.click();
    await page.getByLabel("Descrição", { exact: true }).fill("Sessão expirada");
    await page.getByLabel("Valor", { exact: true }).fill("10");
    const addButton = page.getByRole("button", { name: "ADICIONAR", exact: true });
    await addButton.waitFor();
    state.authenticated = false;
    // This click intentionally races the mocked session change. Dispatch it on
    // the current DOM node so a React refresh cannot invalidate the locator.
    await addButton.evaluate(element => element.click());
    await page.getByText("Sua sessão expirou. Entre novamente para continuar.", { exact: true }).waitFor();
    await audit(page, "expired", 390);
    state.offline = true;
    await page.reload();
    await page.getByRole("alert").waitFor();
    await audit(page, "offline", 390);

    // Test the same build under localhost and the PC's actual IPv4 when available.
    const ip = Object.values(os.networkInterfaces()).flat().find(item => item.family === "IPv4" && !item.internal && !item.address.startsWith("169.254."))?.address;
    state.offline = false;
    for (const host of ["localhost", ...(ip ? [ip] : [])]) {
      await page.goto("http://" + host + ":" + port);
      await page.getByRole("button", { name: "Entrar", exact: true }).waitFor();
      results.push({ scenario: "same-origin-" + host, passed: true });
    }
    results.push({ scenario: "mobile-flows-and-keyboard", passed: true });
  } finally {
    await browser.close();
    server.close();
    fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2));
  }
  console.log(JSON.stringify({ passed: results.length, output }, null, 2));
}
main().catch(error => { console.error(error); server.close(); process.exitCode = 1; });

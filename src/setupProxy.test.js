jest.mock("http-proxy-middleware", () => ({
  createProxyMiddleware: jest.fn(() => "proxy-middleware")
}));

const { createProxyMiddleware } = require("http-proxy-middleware");
const setupProxy = require("./setupProxy");

test("encaminha apenas /api para o HTTPS local durante npm start", () => {
  const app = { use: jest.fn() };
  const middleware = jest.fn();
  createProxyMiddleware.mockReturnValueOnce(middleware);

  setupProxy(app);

  expect(app.use).toHaveBeenCalledWith("/api", middleware);
  expect(createProxyMiddleware).toHaveBeenCalledWith(expect.objectContaining({
    target: "https://localhost:7091",
    changeOrigin: true,
    secure: false,
    xfwd: true
  }));
});

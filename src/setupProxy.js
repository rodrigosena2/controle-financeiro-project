const { createProxyMiddleware } = require("http-proxy-middleware");

const target = process.env.CONTROLE_FINANCEIRO_API_PROXY || "https://localhost:7091";

module.exports = function setupProxy(app) {
  app.use("/api", createProxyMiddleware({
    target,
    changeOrigin: true,
    secure: false,
    xfwd: true,
    onProxyReq(proxyRequest, request) {
      if (request.headers.origin) proxyRequest.setHeader("origin", target);
    }
  }));
};

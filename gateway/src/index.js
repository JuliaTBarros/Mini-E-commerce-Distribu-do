const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { services } = require("./serviceRegistry");
const { startHeartbeat } = require("./heartbeat");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
// Sem express.json() — o body deve passar intacto para os serviços proxiados

function parseJwt(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) return next();
  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

function requireService(name) {
  return (req, res, next) => {
    if (services[name].status === "down") {
      return res.status(503).json({ error: `Serviço ${name} indisponível` });
    }
    next();
  };
}

function createProxy(target) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    onProxyReq: (proxyReq, req) => {
      if (req.user) {
        proxyReq.setHeader("x-forwarded-user", JSON.stringify(req.user));
      }
    },
  });
}

app.use(
  "/users",
  parseJwt,
  requireService("users"),
  createProxy(process.env.USERS_URL),
);
app.use(
  "/products",
  parseJwt,
  requireService("products"),
  createProxy(process.env.PRODUCTS_URL),
);
app.use(
  "/orders",
  parseJwt,
  requireService("orders"),
  createProxy(process.env.ORDERS_URL),
);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "gateway",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  const snapshot = Object.fromEntries(
    Object.entries(services).map(([name, s]) => [
      name,
      { status: s.status, url: s.url, lastCheck: s.lastCheck },
    ]),
  );
  res.json(snapshot);
});

startHeartbeat();
app.listen(PORT, () => console.log(`Gateway running on port ${PORT}`));

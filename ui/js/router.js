import { isLoggedIn, isAdmin } from "./state.js";
import { showToast } from "./ui.js";

import homeView from "./views/home.js";
import catalogView from "./views/catalog.js";
import productView from "./views/product.js";
import cartView from "./views/cart.js";
import ordersView from "./views/orders.js";
import loginView from "./views/login.js";
import registerView from "./views/register.js";
import accountView from "./views/account.js";
import adminView from "./views/admin.js";
import statusView from "./views/status.js";

const routes = [
  { pattern: "/", view: homeView },
  { pattern: "/catalog", view: catalogView },
  { pattern: "/product/:id", view: productView },
  { pattern: "/cart", view: cartView },
  { pattern: "/orders", view: ordersView, requiresAuth: true },
  { pattern: "/login", view: loginView },
  { pattern: "/register", view: registerView },
  { pattern: "/account", view: accountView, requiresAuth: true },
  { pattern: "/admin", view: adminView, requiresAuth: true, requiresAdmin: true },
  { pattern: "/status", view: statusView },
];

function matchRoute(path) {
  for (const route of routes) {
    const paramNames = [];
    const regexStr =
      "^" +
      route.pattern.replace(/:[^/]+/g, (token) => {
        paramNames.push(token.slice(1));
        return "([^/]+)";
      }) +
      "$";
    const match = path.match(new RegExp(regexStr));
    if (match) {
      const params = {};
      paramNames.forEach((name, i) => (params[name] = decodeURIComponent(match[i + 1])));
      return { route, params };
    }
  }
  return null;
}

function parseHash() {
  const hash = window.location.hash.replace(/^#/, "") || "/";
  const [path, queryString] = hash.split("?");
  const query = Object.fromEntries(new URLSearchParams(queryString || ""));
  return { path: path || "/", query };
}

export let pendingRoute = null;
let currentCleanup = null;

export async function navigate() {
  const { path, query } = parseHash();
  const matched = matchRoute(path);
  const app = document.getElementById("app");

  if (!matched) {
    window.location.hash = "#/";
    return;
  }

  const { route, params } = matched;

  currentCleanup?.();
  currentCleanup = null;

  if (route.requiresAuth && !isLoggedIn()) {
    pendingRoute = `#/${path}${window.location.hash.includes("?") ? "?" + window.location.hash.split("?")[1] : ""}`;
    showToast("Faça login para continuar", "info");
    window.location.hash = "#/login";
    return;
  }

  if (route.requiresAdmin && !isAdmin()) {
    app.innerHTML = `
      <div class="flex flex-col items-center justify-center text-center gap-3 py-24">
        <h1 class="text-2xl font-bold">403 — Acesso negado</h1>
        <p class="text-muted-foreground">Esta área é restrita a administradores.</p>
        <a href="#/" class="btn btn-primary mt-2">Voltar para a home</a>
      </div>
    `;
    return;
  }

  window.scrollTo(0, 0);
  const cleanup = await route.view(app, { params, query });
  if (typeof cleanup === "function") currentCleanup = cleanup;
}

export function startRouter() {
  window.addEventListener("hashchange", navigate);
  navigate();
}

export function consumePendingRoute() {
  const route = pendingRoute;
  pendingRoute = null;
  return route;
}

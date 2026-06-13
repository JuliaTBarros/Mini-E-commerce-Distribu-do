import {
  state,
  isLoggedIn,
  isAdmin,
  getCartCount,
  clearAuth,
  toggleTheme,
} from "./state.js";

// ----- Formatação -----
export function formatPrice(price) {
  return `R$ ${Number(price).toFixed(2).replace(".", ",")}`;
}

export function formatDate(iso) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncateMiddle(str, start = 12, end = 6) {
  if (!str || str.length <= start + end + 3) return str;
  return `${str.slice(0, start)}...${str.slice(-end)}`;
}

// ----- Ícones (SVG inline, sem dependências) -----
const icons = {
  cart: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
  sun: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
  moon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  search: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
  menu: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`,
};

// ----- Badges -----
export function stockBadge(product) {
  if (product.stock === 0) {
    return `<span class="badge badge-destructive">Esgotado</span>`;
  }
  if (product.stock < 10) {
    return `<span class="badge badge-warning">Últimas unidades</span>`;
  }
  return `<span class="badge badge-success">Em estoque</span>`;
}

const ORDER_STATUS_LABELS = {
  pending: ["Pendente", "badge-secondary"],
  processing: ["Processando", "badge-info"],
  shipped: ["Enviado", "badge-warning"],
  delivered: ["Entregue", "badge-success"],
  cancelled: ["Cancelado", "badge-destructive"],
};

export function orderStatusBadge(status) {
  const [label, cls] = ORDER_STATUS_LABELS[status] || [status, "badge-outline"];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ----- Card de produto -----
export function productCard(product) {
  const outOfStock = product.stock === 0;
  return `
    <div class="card product-card flex flex-col overflow-hidden">
      <a href="#/product/${product.id}" class="block aspect-square bg-muted overflow-hidden">
        <img src="${product.thumbnail || ""}" alt="${product.name}" loading="lazy"
             class="w-full h-full object-cover"
             onerror="this.src='https://placehold.co/400x400?text=Sem+imagem'" />
      </a>
      <div class="p-4 flex flex-col gap-2 flex-1">
        <span class="text-xs uppercase tracking-wide text-muted-foreground">${product.category || ""}</span>
        <a href="#/product/${product.id}" class="font-medium leading-snug line-clamp-2 hover:text-primary transition-colors">${product.name}</a>
        <span class="text-xs text-muted-foreground">${product.brand || ""}</span>
        <div class="flex items-center justify-between mt-1">
          <span class="font-semibold">${formatPrice(product.price)}</span>
          ${stockBadge(product)}
        </div>
        <button class="btn btn-primary btn-sm mt-2 w-full" data-action="add-to-cart" data-id="${product.id}" ${outOfStock ? "disabled" : ""}>
          Adicionar ao carrinho
        </button>
      </div>
    </div>
  `;
}

export function skeletonCards(n = 8) {
  return Array.from({ length: n })
    .map(
      () => `
      <div class="card overflow-hidden">
        <div class="aspect-square skeleton"></div>
        <div class="p-4 flex flex-col gap-2">
          <div class="skeleton h-3 w-1/3"></div>
          <div class="skeleton h-4 w-full"></div>
          <div class="skeleton h-4 w-2/3"></div>
        </div>
      </div>`,
    )
    .join("");
}

export function emptyState(message, ctaHtml = "") {
  return `
    <div class="flex flex-col items-center justify-center text-center gap-3 py-16 text-muted-foreground">
      <p class="text-lg">${message}</p>
      ${ctaHtml}
    </div>
  `;
}

// ----- Toasts -----
export function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const colors = {
    info: "badge-info",
    success: "badge-success",
    error: "badge-destructive",
  };
  const el = document.createElement("div");
  el.className = `toast card px-4 py-3 text-sm flex items-center gap-2`;
  el.innerHTML = `<span class="badge ${colors[type] || colors.info}">●</span> ${message}`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ----- Navbar -----
function overallHealth(services) {
  const values = Object.values(services || {});
  if (values.length === 0) return "unknown";
  if (values.some((s) => s.status === "down")) return "down";
  if (values.some((s) => s.status === "unknown")) return "unknown";
  return "up";
}

export function renderNavbar() {
  const navbar = document.getElementById("navbar");
  const loggedIn = isLoggedIn();
  const admin = isAdmin();
  const cartCount = getCartCount();
  const health = overallHealth(state.services);
  const themeIcon = state.theme === "dark" ? icons.sun : icons.moon;

  navbar.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center h-16 gap-4">
        <a href="#/" class="font-bold text-lg text-primary whitespace-nowrap">Mini E-commerce</a>

        <nav class="hidden md:flex items-center gap-1 ml-2">
          <a href="#/catalog" class="btn btn-ghost btn-sm">Catálogo</a>
          ${loggedIn ? `<a href="#/orders" class="btn btn-ghost btn-sm">Meus Pedidos</a>` : ""}
          ${admin ? `<a href="#/admin" class="btn btn-ghost btn-sm">Admin</a>` : ""}
          <a href="#/status" class="btn btn-ghost btn-sm flex items-center gap-2">
            Status <span class="health-dot ${health}"></span>
          </a>
        </nav>

        <form id="navbar-search" class="hidden sm:flex flex-1 max-w-sm ml-auto items-center relative">
          <span class="absolute left-3 text-muted-foreground">${icons.search}</span>
          <input type="search" name="q" placeholder="Buscar produtos..." class="input pl-9" />
        </form>

        <div class="flex items-center gap-1 ml-auto sm:ml-2">
          <button id="theme-toggle" class="btn btn-ghost btn-icon" title="Alternar tema">${themeIcon}</button>

          <a href="#/cart" class="btn btn-ghost btn-icon relative" title="Carrinho">
            ${icons.cart}
            ${cartCount > 0 ? `<span class="absolute -top-1 -right-1 badge badge-default px-1.5 py-0 text-[10px]">${cartCount}</span>` : ""}
          </a>

          ${
            loggedIn
              ? `
            <a href="#/account" class="btn btn-ghost btn-sm hidden sm:flex items-center gap-2">
              ${icons.user} ${state.auth.user.name?.split(" ")[0] || "Conta"}
            </a>
            <button id="logout-btn" class="btn btn-outline btn-sm hidden sm:flex">Sair</button>
          `
              : `<a href="#/login" class="btn btn-primary btn-sm">Entrar</a>`
          }

          <button id="mobile-menu-toggle" class="btn btn-ghost btn-icon md:hidden">${icons.menu}</button>
        </div>
      </div>

      <div id="mobile-menu" class="hidden md:hidden pb-4 flex flex-col gap-1">
        <a href="#/catalog" class="btn btn-ghost btn-sm justify-start">Catálogo</a>
        ${loggedIn ? `<a href="#/orders" class="btn btn-ghost btn-sm justify-start">Meus Pedidos</a>` : ""}
        ${admin ? `<a href="#/admin" class="btn btn-ghost btn-sm justify-start">Admin</a>` : ""}
        <a href="#/status" class="btn btn-ghost btn-sm justify-start">Status</a>
        ${
          loggedIn
            ? `<a href="#/account" class="btn btn-ghost btn-sm justify-start">Conta</a>
               <button id="logout-btn-mobile" class="btn btn-outline btn-sm justify-start">Sair</button>`
            : `<a href="#/login" class="btn btn-primary btn-sm justify-start">Entrar</a>`
        }
      </div>
    </div>
  `;

  navbar.querySelector("#theme-toggle").addEventListener("click", toggleTheme);

  navbar.querySelector("#navbar-search").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = new FormData(e.target).get("q");
    window.location.hash = `#/catalog?q=${encodeURIComponent(q || "")}`;
  });

  navbar.querySelector("#mobile-menu-toggle")?.addEventListener("click", () => {
    navbar.querySelector("#mobile-menu").classList.toggle("hidden");
  });

  const logout = () => {
    clearAuth();
    showToast("Sessão encerrada", "info");
    window.location.hash = "#/";
  };
  navbar.querySelector("#logout-btn")?.addEventListener("click", logout);
  navbar.querySelector("#logout-btn-mobile")?.addEventListener("click", logout);
}

const AUTH_KEY = "mec_auth";
const CART_KEY = "mec_cart";
const THEME_KEY = "mec_theme";

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const listeners = { auth: [], cart: [], products: [], services: [], theme: [] };

function emit(channel) {
  listeners[channel].forEach((fn) => fn());
}

export function subscribe(channel, fn) {
  listeners[channel].push(fn);
  return () => {
    listeners[channel] = listeners[channel].filter((f) => f !== fn);
  };
}

export const state = {
  auth: loadJSON(AUTH_KEY, null), // { token, user }
  cart: loadJSON(CART_KEY, []), // [{ productId, quantity }]
  products: new Map(), // id -> product
  services: {}, // snapshot de /api/health
  theme: loadJSON(THEME_KEY, "light"),
};

// ----- Auth -----
export function setAuth(auth) {
  state.auth = auth;
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  emit("auth");
}

export function clearAuth() {
  state.auth = null;
  localStorage.removeItem(AUTH_KEY);
  emit("auth");
}

export function isLoggedIn() {
  return !!state.auth?.token;
}

export function isAdmin() {
  return state.auth?.user?.role === "admin";
}

// ----- Products cache -----
export function setProducts(products) {
  state.products = new Map(products.map((p) => [p.id, p]));
  emit("products");
}

export function getCachedProduct(id) {
  return state.products.get(id);
}

export function getAllCachedProducts() {
  return Array.from(state.products.values());
}

// ----- Carrinho -----
function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
  emit("cart");
}

export function addToCart(productId, quantity = 1) {
  const product = state.products.get(productId);
  const maxStock = product?.stock ?? Infinity;
  const existing = state.cart.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, maxStock);
  } else {
    state.cart.push({ productId, quantity: Math.min(quantity, maxStock) });
  }
  saveCart();
}

export function updateCartQuantity(productId, quantity) {
  const item = state.cart.find((i) => i.productId === productId);
  if (!item) return;
  const product = state.products.get(productId);
  const maxStock = product?.stock ?? Infinity;
  item.quantity = Math.max(1, Math.min(quantity, maxStock));
  saveCart();
}

export function removeFromCart(productId) {
  state.cart = state.cart.filter((i) => i.productId !== productId);
  saveCart();
}

export function clearCart() {
  state.cart = [];
  saveCart();
}

export function getCartCount() {
  return state.cart.reduce((sum, i) => sum + i.quantity, 0);
}

export function getCartItems() {
  return state.cart
    .map((i) => ({ ...i, product: state.products.get(i.productId) }))
    .filter((i) => i.product);
}

// ----- Status dos serviços -----
export function setServices(services) {
  state.services = services;
  emit("services");
}

// ----- Tema -----
export function initTheme() {
  document.documentElement.classList.toggle("dark", state.theme === "dark");
}

export function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, JSON.stringify(state.theme));
  initTheme();
  emit("theme");
}

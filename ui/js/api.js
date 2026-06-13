export const GATEWAY_URL = "http://localhost:5000";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function apiFetch(path, { method = "GET", body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${GATEWAY_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Não foi possível conectar ao servidor", 0);
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(data?.error || `Erro ${res.status}`, res.status);
  }
  return data;
}

// ----- Auth -----
export function login(email, password) {
  return apiFetch("/users/login", { method: "POST", body: { email, password } });
}

export function register(name, email, password) {
  return apiFetch("/users/register", { method: "POST", body: { name, email, password } });
}

export function getUser(id, token) {
  return apiFetch(`/users/${id}`, { token });
}

// ----- Products -----
export function getProducts() {
  return apiFetch("/products");
}

export function getProduct(id) {
  return apiFetch(`/products/${id}`);
}

export function createProduct(product, token) {
  return apiFetch("/products", { method: "POST", body: product, token });
}

// ----- Orders -----
export function createOrder(order, token) {
  return apiFetch("/orders", { method: "POST", body: order, token });
}

export function getOrders(userId, token) {
  return apiFetch(`/orders/${userId}`, { token });
}

// ----- Health -----
export function getHealth() {
  return apiFetch("/api/health");
}

export { ApiError };

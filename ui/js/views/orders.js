import { getOrders } from "../api.js";
import { state, getCachedProduct } from "../state.js";
import { formatPrice, formatDate, orderStatusBadge, emptyState } from "../ui.js";

function orderRow(order) {
  const product = getCachedProduct(order.productId);
  return `
    <div class="card p-4 flex flex-wrap items-center gap-4">
      <div class="w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
        <img src="${product?.thumbnail || ""}" alt="${product?.name || "Produto"}" class="w-full h-full object-cover"
             onerror="this.src='https://placehold.co/80x80?text=%3F'" />
      </div>
      <div class="flex-1 min-w-[8rem]">
        <p class="font-medium">
          ${product ? `<a href="#/product/${product.id}" class="hover:text-primary transition-colors">${product.name}</a>` : "Produto não encontrado"}
        </p>
        <p class="text-sm text-muted-foreground">
          Quantidade: ${order.quantity}${product ? ` · ${formatPrice(product.price * order.quantity)}` : ""}
        </p>
        <p class="text-xs text-muted-foreground font-mono mt-1">#${order.id.slice(0, 8)}</p>
      </div>
      <div class="flex flex-col items-end gap-1">
        ${orderStatusBadge(order.status)}
        <span class="text-xs text-muted-foreground">${formatDate(order.createdAt)}</span>
      </div>
    </div>
  `;
}

export default async function render(app) {
  app.innerHTML = `<div class="py-24 text-center text-muted-foreground">Carregando pedidos...</div>`;

  let orders;
  try {
    orders = await getOrders(state.auth.user.id, state.auth.token);
  } catch (err) {
    app.innerHTML = `
      <div class="flex flex-col items-center justify-center text-center gap-3 py-24">
        <h1 class="text-2xl font-bold">Não foi possível carregar seus pedidos</h1>
        <p class="text-muted-foreground">${err.message}</p>
      </div>`;
    return;
  }

  if (orders.length === 0) {
    app.innerHTML = `
      <h1 class="text-2xl font-bold mb-6">Meus Pedidos</h1>
      ${emptyState("Você ainda não tem pedidos.", `<a href="#/catalog" class="btn btn-primary">Ver catálogo</a>`)}
    `;
    return;
  }

  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  app.innerHTML = `
    <h1 class="text-2xl font-bold mb-6">Meus Pedidos</h1>
    <div class="flex flex-col gap-3">
      ${orders.map(orderRow).join("")}
    </div>
  `;
}

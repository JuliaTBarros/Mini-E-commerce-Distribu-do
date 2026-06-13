import {
  subscribe,
  getCartItems,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  isLoggedIn,
  state,
} from "../state.js";
import { createOrder } from "../api.js";
import { formatPrice, showToast, emptyState } from "../ui.js";

function cartItemRow(item) {
  const { product, quantity, productId } = item;
  return `
    <div id="cart-item-${productId}" class="card p-3 flex flex-wrap items-center gap-3">
      <a href="#/product/${productId}" class="w-20 h-20 rounded overflow-hidden bg-muted flex-shrink-0">
        <img src="${product.thumbnail || ""}" alt="${product.name}" class="w-full h-full object-cover"
             onerror="this.src='https://placehold.co/100x100?text=Sem+imagem'" />
      </a>
      <div class="flex-1 min-w-[8rem]">
        <a href="#/product/${productId}" class="font-medium line-clamp-1 hover:text-primary transition-colors">${product.name}</a>
        <p class="text-sm text-muted-foreground">${formatPrice(product.price)} / unid.</p>
      </div>
      <div class="flex items-center gap-2">
        <button data-action="decrease" class="btn btn-outline btn-icon btn-sm">−</button>
        <span class="w-8 text-center">${quantity}</span>
        <button data-action="increase" class="btn btn-outline btn-icon btn-sm" ${quantity >= product.stock ? "disabled" : ""}>+</button>
      </div>
      <div class="font-semibold w-24 text-right">${formatPrice(product.price * quantity)}</div>
      <button data-action="remove" class="btn btn-ghost btn-icon text-destructive" title="Remover">✕</button>
    </div>
  `;
}

export default async function render(app) {
  function draw() {
    const items = getCartItems();

    if (items.length === 0) {
      app.innerHTML = `
        <h1 class="text-2xl font-bold mb-6">Carrinho</h1>
        ${emptyState("Seu carrinho está vazio.", `<a href="#/catalog" class="btn btn-primary">Ver catálogo</a>`)}
      `;
      return;
    }

    const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

    app.innerHTML = `
      <h1 class="text-2xl font-bold mb-6">Carrinho</h1>
      <div class="grid lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 flex flex-col gap-3">
          ${items.map(cartItemRow).join("")}
        </div>
        <div class="card p-4 h-fit flex flex-col gap-3">
          <h2 class="font-semibold">Resumo do pedido</h2>
          <div class="flex justify-between font-semibold border-t border-border pt-3 mt-1">
            <span>Total</span><span>${formatPrice(total)}</span>
          </div>
          <button id="checkout-btn" class="btn btn-primary w-full mt-2">Finalizar pedido</button>
          ${!isLoggedIn() ? `<p class="text-xs text-muted-foreground text-center">Você precisará entrar para finalizar o pedido.</p>` : ""}
        </div>
      </div>
    `;

    items.forEach((item) => {
      const row = document.getElementById(`cart-item-${item.productId}`);
      row.querySelector('[data-action="decrease"]').addEventListener("click", () => {
        if (item.quantity <= 1) {
          removeFromCart(item.productId);
        } else {
          updateCartQuantity(item.productId, item.quantity - 1);
        }
      });
      row.querySelector('[data-action="increase"]').addEventListener("click", () => {
        updateCartQuantity(item.productId, item.quantity + 1);
      });
      row.querySelector('[data-action="remove"]').addEventListener("click", () => {
        removeFromCart(item.productId);
        showToast("Item removido do carrinho", "info");
      });
    });

    document.getElementById("checkout-btn").addEventListener("click", handleCheckout);
  }

  async function handleCheckout() {
    if (!isLoggedIn()) {
      showToast("Faça login para finalizar o pedido", "info");
      window.location.hash = "#/login";
      return;
    }

    const items = getCartItems();
    const btn = document.getElementById("checkout-btn");
    btn.disabled = true;
    btn.textContent = "Processando...";

    try {
      for (const item of items) {
        await createOrder({ productId: item.productId, quantity: item.quantity }, state.auth.token);
      }
      clearCart();
      showToast("Pedido realizado com sucesso!", "success");
      window.location.hash = "#/orders";
    } catch (err) {
      showToast(err.message || "Erro ao finalizar pedido", "error");
      btn.disabled = false;
      btn.textContent = "Finalizar pedido";
    }
  }

  draw();
  return subscribe("cart", draw);
}

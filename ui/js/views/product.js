import { getProduct } from "../api.js";
import { getCachedProduct, addToCart } from "../state.js";
import { formatPrice, stockBadge, showToast } from "../ui.js";

export default async function render(app, { params }) {
  const { id } = params;
  let product = getCachedProduct(id);

  if (!product) {
    app.innerHTML = `<div class="py-24 text-center text-muted-foreground">Carregando produto...</div>`;
    try {
      product = await getProduct(id);
    } catch {
      app.innerHTML = `
        <div class="flex flex-col items-center justify-center text-center gap-3 py-24">
          <h1 class="text-2xl font-bold">Produto não encontrado</h1>
          <a href="#/catalog" class="btn btn-primary mt-2">Voltar ao catálogo</a>
        </div>`;
      return;
    }
  }

  const maxQty = Math.max(product.stock, 0);

  app.innerHTML = `
    <a href="#/catalog" class="text-sm text-primary hover:underline mb-4 inline-block">← Voltar ao catálogo</a>
    <div class="grid md:grid-cols-2 gap-8">
      <div class="card aspect-square overflow-hidden bg-muted">
        <img src="${product.thumbnail || ""}" alt="${product.name}" class="w-full h-full object-cover"
             onerror="this.src='https://placehold.co/600x600?text=Sem+imagem'" />
      </div>
      <div class="flex flex-col gap-3">
        <span class="text-xs uppercase tracking-wide text-muted-foreground">${product.category || ""}</span>
        <h1 class="text-2xl font-bold">${product.name}</h1>
        <span class="text-sm text-muted-foreground">${product.brand || ""}</span>
        <div class="flex items-center gap-3">
          <span class="text-2xl font-semibold">${formatPrice(product.price)}</span>
          ${stockBadge(product)}
        </div>
        <p class="text-muted-foreground leading-relaxed">${product.description || "Sem descrição disponível."}</p>
        <p class="text-sm text-muted-foreground">${product.stock} unidade${product.stock === 1 ? "" : "s"} em estoque</p>

        ${
          maxQty > 0
            ? `
          <div class="flex items-center gap-3 mt-2">
            <label class="label mb-0">Quantidade</label>
            <input id="qty-input" type="number" min="1" max="${maxQty}" value="1" class="input w-20" />
          </div>
          <div class="flex flex-wrap gap-3 mt-2">
            <button id="add-cart-btn" data-action="add-to-cart" data-id="${product.id}" data-qty="1" class="btn btn-primary">Adicionar ao carrinho</button>
            <button id="buy-now-btn" class="btn btn-outline">Comprar agora</button>
          </div>
        `
            : `
          <div class="mt-2">
            <button class="btn btn-primary" disabled>Esgotado</button>
          </div>
        `
        }
      </div>
    </div>
  `;

  if (maxQty > 0) {
    const qtyInput = document.getElementById("qty-input");
    const addBtn = document.getElementById("add-cart-btn");

    qtyInput.addEventListener("input", () => {
      let v = parseInt(qtyInput.value, 10) || 1;
      v = Math.min(Math.max(v, 1), maxQty);
      qtyInput.value = v;
      addBtn.dataset.qty = String(v);
    });

    document.getElementById("buy-now-btn").addEventListener("click", () => {
      const qty = Math.min(Math.max(parseInt(qtyInput.value, 10) || 1, 1), maxQty);
      addToCart(product.id, qty);
      showToast("Produto adicionado ao carrinho", "success");
      window.location.hash = "#/cart";
    });
  }
}

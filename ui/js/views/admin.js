import { createProduct } from "../api.js";
import { state, setProducts, getAllCachedProducts, subscribe } from "../state.js";
import { formatPrice, showToast, stockBadge } from "../ui.js";

function productRow(product) {
  return `
    <tr>
      <td>
        <div class="flex items-center gap-2">
          <img src="${product.thumbnail || ""}" alt="${product.name}" class="w-8 h-8 rounded object-cover bg-muted flex-shrink-0"
               onerror="this.src='https://placehold.co/32x32?text=%3F'" />
          <span class="line-clamp-1 max-w-[12rem]">${product.name}</span>
        </div>
      </td>
      <td class="capitalize">${product.category || "-"}</td>
      <td>${formatPrice(product.price)}</td>
      <td>${stockBadge(product)}</td>
    </tr>
  `;
}

export default async function render(app) {
  function draw() {
    const products = getAllCachedProducts();

    app.innerHTML = `
      <h1 class="text-2xl font-bold mb-6">Administração de Produtos</h1>
      <div class="grid lg:grid-cols-3 gap-6">
        <form id="product-form" class="card p-6 flex flex-col gap-3 h-fit">
          <h2 class="font-semibold mb-1">Novo Produto</h2>
          <div id="product-alert"></div>
          <div>
            <label class="label">Nome *</label>
            <input name="name" required class="input" />
          </div>
          <div>
            <label class="label">Descrição</label>
            <textarea name="description" rows="3" class="textarea"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Categoria</label>
              <input name="category" class="input" />
            </div>
            <div>
              <label class="label">Marca</label>
              <input name="brand" class="input" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Preço *</label>
              <input name="price" type="number" step="0.01" min="0" required class="input" />
            </div>
            <div>
              <label class="label">Estoque *</label>
              <input name="stock" type="number" min="0" required class="input" />
            </div>
          </div>
          <div>
            <label class="label">URL da imagem</label>
            <input name="thumbnail" type="url" class="input" placeholder="https://..." />
          </div>
          <button type="submit" class="btn btn-primary w-full mt-2">Criar produto</button>
        </form>

        <div class="lg:col-span-2 card overflow-x-auto">
          <table class="table">
            <thead>
              <tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th></tr>
            </thead>
            <tbody>
              ${products.map(productRow).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById("product-form").addEventListener("submit", handleSubmit);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const alertBox = document.getElementById("product-alert");
    alertBox.innerHTML = "";
    const submitBtn = form.querySelector('button[type="submit"]');

    const formData = new FormData(form);
    const payload = {
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      category: formData.get("category") || undefined,
      brand: formData.get("brand") || undefined,
      thumbnail: formData.get("thumbnail") || undefined,
      price: parseFloat(formData.get("price")),
      stock: parseInt(formData.get("stock"), 10),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Criando...";
    try {
      const product = await createProduct(payload, state.auth.token);
      setProducts([...getAllCachedProducts(), product]);
      showToast("Produto criado e replicado com sucesso", "success");
    } catch (err) {
      alertBox.innerHTML = `<div class="alert alert-destructive">${err.message}</div>`;
      submitBtn.disabled = false;
      submitBtn.textContent = "Criar produto";
    }
  }

  draw();
  return subscribe("products", draw);
}

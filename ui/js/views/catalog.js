import { subscribe, getAllCachedProducts } from "../state.js";
import { productCard, skeletonCards, emptyState } from "../ui.js";

export default async function render(app, { query }) {
  const filters = {
    search: query.q || "",
    category: query.category || "",
    sort: "",
  };

  function renderGrid() {
    const grid = document.getElementById("catalog-grid");
    const countEl = document.getElementById("catalog-count");
    if (!grid) return;

    let products = getAllCachedProducts();

    if (filters.search) {
      const q = filters.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q),
      );
    }
    if (filters.category) {
      products = products.filter((p) => p.category === filters.category);
    }
    if (filters.sort === "price-asc") {
      products = [...products].sort((a, b) => a.price - b.price);
    } else if (filters.sort === "price-desc") {
      products = [...products].sort((a, b) => b.price - a.price);
    }

    if (countEl) countEl.textContent = `${products.length} produto${products.length === 1 ? "" : "s"}`;
    grid.innerHTML = products.length
      ? `<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">${products.map(productCard).join("")}</div>`
      : emptyState("Nenhum produto encontrado para esse filtro.");
  }

  function renderShell() {
    const products = getAllCachedProducts();
    const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
    const loading = products.length === 0;

    app.innerHTML = `
      <div class="flex flex-col gap-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold">Catálogo</h1>
            <p id="catalog-count" class="text-sm text-muted-foreground"></p>
          </div>
          <div class="flex flex-wrap gap-2">
            <input id="search-input" type="search" placeholder="Buscar por nome ou marca..."
                   class="input max-w-xs" value="${filters.search}" />
            <select id="category-select" class="select w-auto">
              <option value="">Todas categorias</option>
              ${categories
                .map(
                  (c) =>
                    `<option value="${c}" ${filters.category === c ? "selected" : ""}>${c}</option>`,
                )
                .join("")}
            </select>
            <select id="sort-select" class="select w-auto">
              <option value="">Relevância</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
            </select>
          </div>
        </div>
        <div id="catalog-grid">
          ${loading ? `<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">${skeletonCards(8)}</div>` : ""}
        </div>
      </div>
    `;

    document.getElementById("search-input").addEventListener("input", (e) => {
      filters.search = e.target.value;
      renderGrid();
    });
    document.getElementById("category-select").addEventListener("change", (e) => {
      filters.category = e.target.value;
      renderGrid();
    });
    document.getElementById("sort-select").addEventListener("change", (e) => {
      filters.sort = e.target.value;
      renderGrid();
    });

    if (!loading) renderGrid();
  }

  renderShell();
  return subscribe("products", renderShell);
}

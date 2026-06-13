import { subscribe, getAllCachedProducts } from "../state.js";
import { productCard, skeletonCards } from "../ui.js";

function categoryChips(products) {
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
  return categories
    .map(
      (c) =>
        `<a href="#/catalog?category=${encodeURIComponent(c)}" class="chip capitalize">${c}</a>`,
    )
    .join("");
}

export default async function render(app) {
  function draw() {
    const products = getAllCachedProducts();
    const featured = products.slice(0, 8);

    app.innerHTML = `
      <section class="card p-8 sm:p-12 mb-10 bg-secondary border-0 text-center">
        <h1 class="text-3xl sm:text-4xl font-bold text-secondary-foreground">Mini E-commerce Distribuído</h1>
        <p class="mt-3 text-muted-foreground max-w-2xl mx-auto">
          Um catálogo completo com réplica de produtos, pedidos rastreáveis e autenticação JWT —
          tudo rodando em microsserviços independentes.
        </p>
        <a href="#/catalog" class="btn btn-primary mt-6 inline-flex">Ver catálogo</a>
      </section>

      ${
        products.length
          ? `
        <section class="mb-10">
          <h2 class="text-lg font-semibold mb-3">Categorias</h2>
          <div class="flex flex-wrap gap-2">${categoryChips(products)}</div>
        </section>
      `
          : ""
      }

      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold">Produtos em destaque</h2>
          <a href="#/catalog" class="text-sm text-primary hover:underline">Ver todos</a>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          ${featured.length ? featured.map(productCard).join("") : skeletonCards(8)}
        </div>
      </section>
    `;
  }

  draw();
  return subscribe("products", draw);
}

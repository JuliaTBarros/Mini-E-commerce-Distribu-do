import { getProducts, getHealth } from "./api.js";
import { state, subscribe, setProducts, setServices, addToCart, initTheme } from "./state.js";
import { renderNavbar, showToast } from "./ui.js";
import { startRouter, navigate } from "./router.js";

const HEALTH_INTERVAL = 5000;

// Tema (precisa rodar antes da primeira renderização para evitar "flash")
initTheme();

// Navbar reage a mudanças de autenticação, carrinho, status e tema
["auth", "cart", "services", "theme"].forEach((channel) => subscribe(channel, renderNavbar));
renderNavbar();

// Delegação global para botões "Adicionar ao carrinho" (catálogo, home, produto)
document.addEventListener("click", (e) => {
  const btn = e.target.closest('[data-action="add-to-cart"]');
  if (!btn || btn.disabled) return;
  const id = btn.dataset.id;
  const qty = parseInt(btn.dataset.qty || "1", 10);
  addToCart(id, qty);
  showToast("Produto adicionado ao carrinho", "success");
});

// Carrega catálogo de produtos uma vez (cache compartilhado entre views)
async function loadProducts() {
  try {
    const products = await getProducts();
    setProducts(products);
  } catch {
    showToast("Não foi possível carregar os produtos. O serviço pode estar indisponível.", "error");
  }
}

// Polling de saúde dos serviços (alimenta navbar + página de status)
async function pollHealth() {
  try {
    const services = await getHealth();
    setServices(services);
  } catch {
    setServices({});
  }
}

await loadProducts();
await pollHealth();
setInterval(pollHealth, HEALTH_INTERVAL);

startRouter();

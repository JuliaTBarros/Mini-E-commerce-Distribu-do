import { getUser } from "../api.js";
import { state, clearAuth } from "../state.js";
import { showToast, truncateMiddle } from "../ui.js";

export default async function render(app) {
  app.innerHTML = `<div class="py-24 text-center text-muted-foreground">Carregando conta...</div>`;

  let user;
  try {
    user = await getUser(state.auth.user.id, state.auth.token);
  } catch (err) {
    app.innerHTML = `
      <div class="flex flex-col items-center justify-center text-center gap-3 py-24">
        <h1 class="text-2xl font-bold">Não foi possível carregar sua conta</h1>
        <p class="text-muted-foreground">${err.message}</p>
      </div>`;
    return;
  }

  const token = state.auth.token;
  const roleBadgeClass = user.role === "admin" ? "badge-default" : "badge-secondary";
  const initial = (user.name || "?")[0].toUpperCase();

  app.innerHTML = `
    <div class="max-w-md mx-auto py-8">
      <h1 class="text-2xl font-bold mb-6 text-center">Minha Conta</h1>
      <div class="card p-6 flex flex-col items-center gap-3 text-center">
        <img src="${user.image || ""}" alt="${user.name}" class="w-20 h-20 rounded-full object-cover bg-muted"
             onerror="this.src='https://placehold.co/80x80?text=${encodeURIComponent(initial)}'" />
        <h2 class="text-lg font-semibold">${user.name}</h2>
        <p class="text-sm text-muted-foreground">${user.email}</p>
        <span class="badge ${roleBadgeClass} capitalize">${user.role}</span>

        <div class="w-full mt-4 text-left">
          <label class="label">Token JWT</label>
          <div class="flex gap-2">
            <input id="jwt-input" class="input font-mono text-xs" readonly value="${truncateMiddle(token, 20, 8)}" />
            <button id="copy-token-btn" class="btn btn-outline btn-sm">Copiar</button>
          </div>
        </div>

        <button id="logout-btn" class="btn btn-destructive w-full mt-4">Sair</button>
      </div>
    </div>
  `;

  document.getElementById("copy-token-btn").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(token);
      showToast("Token copiado para a área de transferência", "success");
    } catch {
      showToast("Não foi possível copiar o token", "error");
    }
  });

  document.getElementById("logout-btn").addEventListener("click", () => {
    clearAuth();
    showToast("Sessão encerrada", "info");
    window.location.hash = "#/";
  });
}

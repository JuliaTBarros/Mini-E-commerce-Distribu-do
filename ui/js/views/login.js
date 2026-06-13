import { login } from "../api.js";
import { setAuth } from "../state.js";
import { showToast } from "../ui.js";
import { consumePendingRoute } from "../router.js";

export default async function render(app) {
  app.innerHTML = `
    <div class="max-w-sm mx-auto py-8">
      <h1 class="text-2xl font-bold mb-6 text-center">Entrar</h1>
      <form id="login-form" class="card p-6 flex flex-col gap-4">
        <div id="login-alert"></div>
        <div>
          <label class="label">Email</label>
          <input name="email" type="email" required class="input" placeholder="voce@exemplo.com" />
        </div>
        <div>
          <label class="label">Senha</label>
          <input name="password" type="password" required class="input" placeholder="••••••••" />
        </div>
        <button type="submit" class="btn btn-primary w-full">Entrar</button>
        <p class="text-sm text-center text-muted-foreground">
          Não tem conta? <a href="#/register" class="text-primary hover:underline">Criar conta</a>
        </p>
      </form>
    </div>
  `;

  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const alertBox = document.getElementById("login-alert");
    alertBox.innerHTML = "";
    const submitBtn = form.querySelector('button[type="submit"]');

    const formData = new FormData(form);
    const email = formData.get("email");
    const password = formData.get("password");

    submitBtn.disabled = true;
    submitBtn.textContent = "Entrando...";
    try {
      const { token, user } = await login(email, password);
      setAuth({ token, user });
      showToast(`Bem-vindo(a), ${user.name}!`, "success");
      const pending = consumePendingRoute();
      window.location.hash = pending || "#/";
    } catch (err) {
      alertBox.innerHTML = `<div class="alert alert-destructive">${err.message}</div>`;
      submitBtn.disabled = false;
      submitBtn.textContent = "Entrar";
    }
  });
}

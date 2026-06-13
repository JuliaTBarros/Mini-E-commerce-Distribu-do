import { register, login } from "../api.js";
import { setAuth } from "../state.js";
import { showToast } from "../ui.js";
import { consumePendingRoute } from "../router.js";

export default async function render(app) {
  app.innerHTML = `
    <div class="max-w-sm mx-auto py-8">
      <h1 class="text-2xl font-bold mb-6 text-center">Criar conta</h1>
      <form id="register-form" class="card p-6 flex flex-col gap-4">
        <div id="register-alert"></div>
        <div>
          <label class="label">Nome</label>
          <input name="name" type="text" required class="input" placeholder="Seu nome" />
        </div>
        <div>
          <label class="label">Email</label>
          <input name="email" type="email" required class="input" placeholder="voce@exemplo.com" />
        </div>
        <div>
          <label class="label">Senha</label>
          <input name="password" type="password" required minlength="6" class="input" placeholder="••••••••" />
        </div>
        <div>
          <label class="label">Confirmar senha</label>
          <input name="confirmPassword" type="password" required minlength="6" class="input" placeholder="••••••••" />
        </div>
        <button type="submit" class="btn btn-primary w-full">Criar conta</button>
        <p class="text-sm text-center text-muted-foreground">
          Já tem conta? <a href="#/login" class="text-primary hover:underline">Entrar</a>
        </p>
      </form>
    </div>
  `;

  document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const alertBox = document.getElementById("register-alert");
    alertBox.innerHTML = "";
    const submitBtn = form.querySelector('button[type="submit"]');

    const formData = new FormData(form);
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      alertBox.innerHTML = `<div class="alert alert-destructive">As senhas não coincidem</div>`;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Criando conta...";
    try {
      await register(name, email, password);
      const { token, user } = await login(email, password);
      setAuth({ token, user });
      showToast(`Conta criada! Bem-vindo(a), ${user.name}!`, "success");
      const pending = consumePendingRoute();
      window.location.hash = pending || "#/";
    } catch (err) {
      alertBox.innerHTML = `<div class="alert alert-destructive">${err.message}</div>`;
      submitBtn.disabled = false;
      submitBtn.textContent = "Criar conta";
    }
  });
}

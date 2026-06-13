import { subscribe, state } from "../state.js";
import { formatDate } from "../ui.js";

const SERVICE_INFO = [
  { key: "gateway", label: "API Gateway", port: 5000 },
  { key: "users", label: "Usuários", port: 5001 },
  { key: "products", label: "Produtos (Primary)", port: 5002 },
  { key: "orders", label: "Pedidos", port: 5003 },
];

function statusBadge(status) {
  if (status === "up") return `<span class="badge badge-success">Online</span>`;
  if (status === "down") return `<span class="badge badge-destructive">Offline</span>`;
  return `<span class="badge badge-outline">Desconhecido</span>`;
}

export default async function render(app) {
  function draw() {
    const services = state.services || {};
    const hasData = Object.keys(services).length > 0;
    const anyDown = !hasData || Object.values(services).some((s) => s.status === "down");

    app.innerHTML = `
      <h1 class="text-2xl font-bold mb-2">Status dos Serviços</h1>
      <p class="text-sm text-muted-foreground mb-6">
        Atualizado automaticamente a cada 5 segundos via <code class="font-mono">GET /api/health</code> no gateway.
      </p>

      ${
        anyDown
          ? `<div class="alert alert-destructive mb-6">Um ou mais serviços estão indisponíveis. Algumas funcionalidades podem não funcionar corretamente.</div>`
          : ""
      }

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${SERVICE_INFO.map((info) => {
          const data =
            info.key === "gateway"
              ? { status: hasData ? "up" : "down", lastCheck: new Date().toISOString() }
              : services[info.key];
          const status = data?.status || "unknown";
          return `
            <div class="card p-4 flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <h2 class="font-semibold">${info.label}</h2>
                ${statusBadge(status)}
              </div>
              <p class="text-sm text-muted-foreground">Porta ${info.port}</p>
              <p class="text-xs text-muted-foreground">Última verificação: ${data?.lastCheck ? formatDate(data.lastCheck) : "—"}</p>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  draw();
  return subscribe("services", draw);
}

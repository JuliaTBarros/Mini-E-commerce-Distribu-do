const fetch = require("node-fetch");
const { services } = require("./serviceRegistry");

const INTERVAL_MS = 5000;
const TIMEOUT_MS = 2000;
const MAX_FAILURES = 2;

function log(message) {
  console.log(`[${new Date().toISOString()}] [HEARTBEAT] ${message}`);
}

async function checkService(name, service) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${service.url}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const body = await res.json();
    if (body.status !== "ok") throw new Error("status not ok");
    if (service.status === "down") {
      log(`${name} RECOVERED`);
    }
    service.status = "up";
    service.failCount = 0;
    service.lastCheck = new Date().toISOString();
  } catch {
    clearTimeout(timeout);
    service.failCount++;
    service.lastCheck = new Date().toISOString();
    if (service.failCount >= MAX_FAILURES && service.status !== "down") {
      log(`${name} DOWN — ${service.failCount} falhas consecutivas`);
      service.status = "down";
    } else if (service.failCount >= MAX_FAILURES) {
      service.status = "down";
    }
  }
}

function startHeartbeat() {
  setInterval(() => {
    Object.entries(services).forEach(([name, service]) =>
      checkService(name, service),
    );
  }, INTERVAL_MS);
}

module.exports = { startHeartbeat };

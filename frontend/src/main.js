import { api } from "./api.js";

const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");
const btnTest = document.getElementById("btn-test");

function log(mensaje, tipo = "info") {
    console.log(`[${tipo.toUpperCase()}]`, mensaje);
    if (logEl) {
        const time = new Date().toLocaleTimeString();
        logEl.textContent += `[${time}] [${tipo.toUpperCase()}] ${typeof mensaje === "object" ? JSON.stringify(mensaje, null, 2) : mensaje}\n`;
    }
}

async function probarConexion() {
    log("Iniciando prueba de conexión con el backend...");
    if (statusEl) {
        statusEl.textContent = "Conectando...";
        statusEl.className = "pending";
    }

    try {
        const health = await api.checkHealth();
        if (health.ok) {
            log(health.data, "success");
            if (statusEl) {
                statusEl.textContent = "Conectado al Backend";
                statusEl.className = "connected";
            }
        } else {
            log(`Fallo al conectar: ${health.error || "Estado " + health.status}`, "error");
            if (statusEl) {
                statusEl.textContent = "Desconectado";
                statusEl.className = "disconnected";
            }
        }
    } catch (err) {
        log(`Error: ${err.message}`, "error");
        if (statusEl) {
            statusEl.textContent = "Error de Conexión";
            statusEl.className = "disconnected";
        }
    }
}

if (btnTest) {
    btnTest.addEventListener("click", probarConexion);
}

// Ejecutar prueba de conexión al cargar
probarConexion();

// Exportar funciones para uso en ventana si se requiere
window.backendApi = api;
window.probarConexion = probarConexion;

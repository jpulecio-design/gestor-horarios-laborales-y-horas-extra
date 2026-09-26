// Configuración base de la API del Backend
const API_BASE_URL = "http://localhost:3000/api";

/**
 * Cliente HTTP esencial para realizar peticiones al backend
 */
export async function apiRequest(endpoint, options = {}) {
    const { method = "GET", body = null, headers = {} } = options;

    const config = {
        method,
        headers: {
            "Content-Type": "application/json",
            ...headers
        }
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();
        return {
            ok: response.ok,
            status: response.status,
            data
        };
    } catch (error) {
        return {
            ok: false,
            status: 0,
            error: error.message || "Error de conexión con el servidor backend"
        };
    }
}

// Servicios esenciales de conexion 

export const api = {
    // Verificacion de estado del servidor

    checkHealth: () => apiRequest("/test/health"),
    checkDatabase: () => apiRequest("/test/test-db"),

    // Autenticacion

    login: (credentials) => apiRequest("/auth/login", { method: "POST", body: credentials }),

    // Empleados
    
    getEmpleados: () => apiRequest("/empleados"),
    crearEmpleado: (empleado) => apiRequest("/empleados", { method: "POST", body: empleado }),

    // Horas Extra
    
    getHorasExtra: () => apiRequest("/horas-extra"),
    registrarHorasExtra: (data) => apiRequest("/horas-extra", { method: "POST", body: data }),

    // Nomina

    getNomina: () => apiRequest("/nomina"),
    calcularNomina: (data) => apiRequest("/nomina", { method: "POST", body: data })
};

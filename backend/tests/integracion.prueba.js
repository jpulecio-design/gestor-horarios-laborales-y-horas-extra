const app = require("../src/app");

let fallas = 0;

function verificar(nombre, condicion, detalle) {
    if (condicion) {
        console.log("  [OK] " + nombre);
    } else {
        fallas = fallas + 1;
        console.log("  [FALLO] " + nombre + (detalle ? " -> " + detalle : ""));
    }
}

async function probar(base) {
    console.log("\n=== PRUEBA 1: health sin base de datos ===");
    let res = await fetch(base + "/api/test/health");
    let body = await res.json();
    verificar("GET /api/test/health responde 200", res.status === 200 && body.ok === true, "status=" + res.status);

    console.log("\n=== PRUEBA 2: login correcto e incorrecto ===");
    res = await fetch(base + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin@empresa.com", password: "admin123" })
    });
    body = await res.json();
    verificar("POST /api/auth/login con credenciales validas", body.exito === true, JSON.stringify(body));

    res = await fetch(base + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin@empresa.com", password: "incorrecta" })
    });
    body = await res.json();
    verificar("POST /api/auth/login con clave incorrecta", body.exito === false, JSON.stringify(body));

    console.log("\n=== PRUEBA 3: registrar empleado valido e invalido ===");
    res = await fetch(base + "/api/empleados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nombre: "Ana", apellido: "Gómez", cedula: "1001", correo: "ana@correo.com",
            contrasena: "1234", telefono: "3001112233", horaEntrada: "08:00",
            horaSalida: "17:00", turno: "Diurno", acudienteNombre: "Luis Gómez",
            acudienteTelefono: "3104445566", fechaIngreso: "2026-01-15"
        })
    });
    body = await res.json();
    verificar("POST /api/empleados devuelve 201", res.status === 201 && body.usuario && body.usuario.id === 1, "status=" + res.status);

    res = await fetch(base + "/api/empleados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nombre: "", apellido: "", cedula: "", correo: "",
            contrasena: "", telefono: "", horaEntrada: "", horaSalida: "",
            turno: "Diurno", acudienteNombre: "", acudienteTelefono: "", fechaIngreso: ""
        })
    });
    verificar("POST /api/empleados con campos vacios devuelve 400", res.status === 400, "status=" + res.status);

    console.log("\n=== PRUEBA 4: horas extra y nomina enlazados ===");
    res = await fetch(base + "/api/horas-extra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empleadoId: 1, fecha: "2026-08-10", tipo: "Nocturna", cantidadHoras: 2, valorHoraBase: 5000 })
    });
    body = await res.json();
    verificar("POST /api/horas-extra devuelve 201 con valor", res.status === 201 && body.valor === 17500, "status=" + res.status + " valor=" + body.valor);

    res = await fetch(base + "/api/nomina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empleadoId: 1, periodo: "2026-08", salarioBase: 1600000, horasRecargoNocturno: 0, horasRecargoFestivo: 0 })
    });
    body = await res.json();
    verificar(
        "POST /api/nomina incluye las horas extra en la liquidacion",
        res.status === 201 && body.pagoHorasExtra === 17500 && body.netoPagar > 0,
        "status=" + res.status + " extras=" + body.pagoHorasExtra
    );

    console.log("\n=== PRUEBA 5: endpoints de listado ===");
    res = await fetch(base + "/api/empleados/1");
    verificar("GET /api/empleados/1 devuelve 200", res.status === 200, "status=" + res.status);

    res = await fetch(base + "/api/horas-extra");
    body = await res.json();
    verificar("GET /api/horas-extra lista 1 registro", res.status === 200 && body.length === 1, "len=" + body.length);

    res = await fetch(base + "/api/nomina/empleado/1");
    body = await res.json();
    verificar("GET /api/nomina/empleado/1 lista 1 nomina", res.status === 200 && body.length === 1, "len=" + body.length);

    res = await fetch(base + "/api/empleados/999");
    verificar("GET /api/empleados/999 devuelve 404", res.status === 404, "status=" + res.status);
}

const server = app.listen(0, async () => {
    const base = "http://localhost:" + server.address().port;
    try {
        await probar(base);
    } catch (err) {
        fallas = fallas + 1;
        console.log("  [ERROR FATAL] " + err.message);
    } finally {
        server.closeAllConnections();
        server.close(() => {
            console.log("\n" + (fallas === 0 ? "TODAS LAS PRUEBAS DE INTEGRACIÓN PASARON ✅" : "PRUEBAS CON FALLOS: " + fallas));
            process.exitCode = fallas === 0 ? 0 : 1;
        });
    }
});
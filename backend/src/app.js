const express = require("express");

const rutaAutenticacion = require("./modules/auth/rutaAutenticacion");
const rutaTest = require("./modules/test/rutas/rutaTest");
const rutaEmpleados = require("./modules/empleados/rutas/rutaEmpleados");
const rutaHorasExtra = require("./modules/horas-extra/rutas/rutaHorasExtra");
const rutaNomina = require("./modules/nomina/rutas/rutaNomina");

const app = express();

app.use(express.json());

// Middleware CORS esencial para permitir conexiones desde el frontend
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

app.use("/api/auth", rutaAutenticacion);
app.use("/api/test", rutaTest);
app.use("/api/empleados", rutaEmpleados);
app.use("/api/horas-extra", rutaHorasExtra);
app.use("/api/nomina", rutaNomina);

module.exports = app;
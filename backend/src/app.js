const express = require("express");

const autenticar = require("../middlewares/autenticar");

const rutaAutenticacion = require("./modules/auth/rutaAutenticacion");
const rutaTest = require("./modules/test/rutas/rutaTest");
const rutaEmpleados = require("./modules/empleados/rutas/rutaEmpleados");
const rutaHorasExtra = require("./modules/horas-extra/api/rutaHorasExtra");
const rutaNomina = require("./modules/nomina/api/rutaNomina");
const rutaAsistencia = require("./modules/asistencia/api/rutaAsistencia");
const rutaHorarios = require("./modules/horarios-turnos/api/rutaHorarios");
const rutaMonitoreo = require("./modules/monitoreo/api/rutaMonitoreo");
const rutaReportes = require("./modules/reportes/api/rutaReportes");

const app = express();

app.use(express.json());

// Rutas publicas: inicio de sesion y pruebas de salud.
app.use("/api/auth", rutaAutenticacion);
app.use("/api/test", rutaTest);

// A partir de aqui todo exige un token valido (Authorization: Bearer ...).
app.use("/api", autenticar);

app.use("/api/empleados", rutaEmpleados);
app.use("/api/horas-extra", rutaHorasExtra);
app.use("/api/nomina", rutaNomina);
app.use("/api/asistencia", rutaAsistencia);
app.use("/api/horarios", rutaHorarios);
app.use("/api/monitoreo", rutaMonitoreo);
app.use("/api/reportes", rutaReportes);
app.use("/api/backups", rutaBackups);

module.exports = app;
const express = require("express");

const rutaAutenticacion = require("./modules/auth/rutaAutenticacion");
const rutaTest = require("./modules/test/rutas/rutaTest");
const rutaEmpleados = require("./modules/empleados/rutas/rutaEmpleados");
const rutaHorasExtra = require("./modules/horas-extra/api/rutaHorasExtra");
const rutaNomina = require("./modules/nomina/api/rutaNomina");
const rutaAsistencia = require("./modules/asistencia/api/rutaAsistencia");
const rutaHorarios = require("./modules/horarios-turnos/api/rutaHorarios");

const app = express();

app.use(express.json());

app.use("/api/auth", rutaAutenticacion);
app.use("/api/test", rutaTest);
app.use("/api/empleados", rutaEmpleados);
app.use("/api/horas-extra", rutaHorasExtra);
app.use("/api/nomina", rutaNomina);
app.use("/api/asistencia", rutaAsistencia);
app.use("/api/horarios", rutaHorarios);

module.exports = app;
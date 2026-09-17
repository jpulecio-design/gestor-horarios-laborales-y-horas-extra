const express = require("express");

const rutaAutenticacion = require("./modules/auth/rutaAutenticacion");
const rutaTest = require("./modules/test/rutas/rutaTest");
const rutaEmpleados = require("./modules/empleados/rutas/rutaEmpleados");
const rutaHorasExtra = require("./modules/horas-extra/rutas/rutaHorasExtra");
const rutaNomina = require("./modules/nomina/rutas/rutaNomina");

const app = express();

app.use(express.json());

app.use("/api/auth", rutaAutenticacion);
app.use("/api/test", rutaTest);
app.use("/api/empleados", rutaEmpleados);
app.use("/api/horas-extra", rutaHorasExtra);
app.use("/api/nomina", rutaNomina);

module.exports = app;
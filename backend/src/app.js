const express = require("express");

const rutaAutenticacion = require("./modules/auth/rutaAutenticacion");
<<<<<<< HEAD
const rutaTest = require("./modules/test/rutas/rutaTest");
const rutaEmpleados = require("./modules/empleados/rutas/rutaEmpleados");
const rutaHorasExtra = require("./modules/horas-extra/rutas/rutaHorasExtra");
const rutaNomina = require("./modules/nomina/rutas/rutaNomina");

=======

const rutaTest = require("../routes/test.routes");
>>>>>>> b0744e191c009c297844f3c80504fb631f114bdc
const app = express();

app.use(express.json());

app.use("/api/auth", rutaAutenticacion);
app.use("/api/test", rutaTest);
app.use("/api/empleados", rutaEmpleados);
app.use("/api/horas-extra", rutaHorasExtra);
app.use("/api/nomina", rutaNomina);

module.exports = app;
const express = require("express");

const rutaAutenticacion = require(
    "./modules/auth/rutas/rutaAutenticacion"
);

const rutaTest = require("./modules/test/rutas/rutaTest");
const app = express();

app.use(express.json());

app.use("/api/auth", rutaAutenticacion);
app.use("/api/test", rutaTest);

module.exports = app;
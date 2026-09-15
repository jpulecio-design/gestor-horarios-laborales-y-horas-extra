const express = require("express");

const rutaAutenticacion = require(
    "./modules/auth/rutas/rutaAutenticacion"
);

const app = express();

app.use(express.json());

app.use("/api/auth", rutaAutenticacion);

module.exports = app;
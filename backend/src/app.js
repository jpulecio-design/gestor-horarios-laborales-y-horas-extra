const express = require("express");

const rutaAutenticacion = require("./modules/auth/rutaAutenticacion");

const rutaTest = require("../routes/test.routes");
const app = express();

app.use(express.json());

app.use("/api/auth", rutaAutenticacion);
app.use("/api/test", rutaTest);

module.exports = app;
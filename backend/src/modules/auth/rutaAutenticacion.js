const express = require("express");
const controladorAutenticacion = require("./compartido/controladorAutenticacion");14

const router = express.Router();

router.post("/login", controladorAutenticacion.iniciarSesion);

module.exports = router;
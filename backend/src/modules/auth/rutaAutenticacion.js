const express = require("express");

const controladorAutenticacion = require(
    "./compartido/controladorAutenticacion"
);

const router = express.Router();

router.post("/login", controladorAutenticacion.iniciarSesion);

module.exports = router;
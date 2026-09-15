const express = require("express");

const controladorAutenticacion = require(
    "../compartido/controladores/controladorAutenticacion"
);

const router = express.Router();

router.post("/login", controladorAutenticacion.iniciarSesion);

module.exports = router;
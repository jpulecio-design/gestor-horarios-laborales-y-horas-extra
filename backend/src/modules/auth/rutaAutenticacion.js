const express = require("express");
const controladorAutenticacion = require("./compartido/controladorAutenticacion");
const autenticar = require("../../../middlewares/autenticar");

const router = express.Router();

router.post("/login", controladorAutenticacion.iniciarSesion);
router.post("/cambiar-contrasena", autenticar, controladorAutenticacion.cambiarContrasena);

module.exports = router;
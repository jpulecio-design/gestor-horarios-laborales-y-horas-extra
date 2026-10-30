const express = require("express");
const controladorAutenticacion = require("./compartido/controladorAutenticacion");

const router = express.Router();

router.post("/login", controladorAutenticacion.iniciarSesion);
router.post("/recuperar-contrasena", controladorAutenticacion.solicitarRecuperacion);
router.post("/restablecer-contrasena", controladorAutenticacion.restablecerContrasena);

module.exports = router;
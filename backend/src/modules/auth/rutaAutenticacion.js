const express = require("express");
const controladorAutenticacion = require("./compartido/controladorAutenticacion");
const autenticar = require("../../../middlewares/autenticar");

const router = express.Router();

router.post("/login", controladorAutenticacion.iniciarSesion);

// Perfil del usuario autenticado (requiere Bearer token).
router.get("/me", autenticar, controladorAutenticacion.perfil);

module.exports = router;
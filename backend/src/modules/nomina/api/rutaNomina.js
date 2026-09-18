const express = require("express");

const controlador = require("../app/controladorNomina");
const repositorio = require("../datos/repositorioNomina");

const router = express.Router();

// GET /api/nomina -> todas las nominas
router.get("/", (req, res) => {
    res.json(repositorio.obtenerTodas());
});

// GET /api/nomina/empleado/:id -> nominas de un empleado
router.get("/empleado/:id", (req, res) => {
    res.json(repositorio.obtenerPorEmpleado(Number(req.params.id)));
});

// GET /api/nomina/:id -> una nomina por id
router.get("/:id", (req, res) => {
    const nomina = repositorio.buscarPorId(Number(req.params.id));
    if (nomina === null) {
        res.status(404).json({ error: "No existe una nómina con ese id." });
    } else {
        res.json(nomina);
    }
});

// POST /api/nomina -> registra (y liquida) una nomina
router.post("/", (req, res) => {
    const resultado = controlador.registrarNomina(req.body);
    if (resultado.exito) {
        res.status(201).json(resultado.datos);
    } else {
        res.status(400).json({ error: resultado.mensaje });
    }
});

module.exports = router;
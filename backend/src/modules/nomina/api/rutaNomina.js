const express = require("express");

const controlador = require("../app/controladorNomina");
const repositorio = require("../datos/repositorioNomina");

const { autorizar, autorizarPropio } = require("../../../../middlewares/autorizar");

const router = express.Router();

const GESTION = ["Administrador", "Contadora"];

// GET /api/nomina -> todas las nominas
router.get("/", autorizar(...GESTION), async (req, res) => {
    try {
        res.json(await repositorio.obtenerTodas());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/nomina/empleado/:id -> nominas de un empleado
router.get("/empleado/:id", autorizarPropio(...GESTION), async (req, res) => {
    try {
        res.json(await repositorio.obtenerPorEmpleado(Number(req.params.id)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/nomina/:id -> una nomina por id
router.get("/:id", autorizar(...GESTION), async (req, res) => {
    try {
        const nomina = await repositorio.buscarPorId(Number(req.params.id));
        if (nomina === null) {
            res.status(404).json({ error: "No existe una nómina con ese id." });
        } else {
            res.json(nomina);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/nomina -> registra (y liquida) una nomina
router.post("/", autorizar(...GESTION), async (req, res) => {
    try {
        const resultado = await controlador.registrarNomina(req.body);
        if (resultado.exito) {
            res.status(201).json(resultado.datos);
        } else {
            res.status(400).json({ error: resultado.mensaje });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

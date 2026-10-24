const express = require("express");

const controlador = require("../app/controladorHorasExtra");
const repositorio = require("../datos/repositorioHorasExtra");

const { autorizar, autorizarPropio } = require("../../../../middlewares/autorizar");

const router = express.Router();

const GESTION = ["Administrador", "Contadora"];

// GET /api/horas-extra -> todas las horas extra
router.get("/", autorizar(...GESTION), async (req, res) => {
    try {
        res.json(await repositorio.obtenerTodas());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/horas-extra/empleado/:id -> horas extra de un empleado
router.get("/empleado/:id", autorizarPropio(...GESTION), async (req, res) => {
    try {
        res.json(await repositorio.obtenerPorEmpleado(Number(req.params.id)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/horas-extra/empleado/:id/periodo/:periodo -> horas extra de un empleado en un periodo AAAA-MM
router.get("/empleado/:id/periodo/:periodo", autorizarPropio(...GESTION), async (req, res) => {
    try {
        res.json(await repositorio.obtenerPorEmpleadoPeriodo(
            Number(req.params.id),
            req.params.periodo
        ));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/horas-extra -> registra una hora extra
router.post("/", autorizar("Administrador"), async (req, res) => {
    try {
        const resultado = await controlador.registrarHoraExtra(req.body);
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

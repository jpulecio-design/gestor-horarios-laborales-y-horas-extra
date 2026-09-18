const express = require("express");

const controlador = require("../app/controladorHorasExtra");
const repositorio = require("../datos/repositorioHorasExtra");

const router = express.Router();

// GET /api/horas-extra -> todas las horas extra
router.get("/", (req, res) => {
    res.json(repositorio.obtenerTodas());
});

// GET /api/horas-extra/empleado/:id -> horas extra de un empleado
router.get("/empleado/:id", (req, res) => {
    res.json(repositorio.obtenerPorEmpleado(Number(req.params.id)));
});

// GET /api/horas-extra/empleado/:id/periodo/:periodo -> horas extra de un empleado en un periodo AAAA-MM
router.get("/empleado/:id/periodo/:periodo", (req, res) => {
    res.json(repositorio.obtenerPorEmpleadoPeriodo(
        Number(req.params.id),
        req.params.periodo
    ));
});

// POST /api/horas-extra -> registra una hora extra
router.post("/", (req, res) => {
    const resultado = controlador.registrarHoraExtra(req.body);
    if (resultado.exito) {
        res.status(201).json(resultado.datos);
    } else {
        res.status(400).json({ error: resultado.mensaje });
    }
});

module.exports = router;
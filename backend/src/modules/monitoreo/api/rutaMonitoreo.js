const express = require("express");

const controlador = require("../app/controladorMonitoreo");

const { autorizar } = require("../../../../middlewares/autorizar");

const router = express.Router();

const GESTION = ["Administrador", "Contadora"];

// GET /api/monitoreo/general?desde=AAAA-MM-DD&hasta=AAAA-MM-DD
// Resumen de asistencia y horas extra de todos los empleados.
router.get("/general", autorizar(...GESTION), async (req, res) => {
    try {
        const resultado = await controlador.monitorearGeneral(req.query.desde, req.query.hasta);
        if (resultado.exito) {
            res.json(resultado.datos);
        } else {
            res.status(400).json({ error: resultado.mensaje });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/monitoreo/empleado/:id?desde=AAAA-MM-DD&hasta=AAAA-MM-DD
// Resumen de un empleado: dias y horas trabajadas, y horas extra.
router.get("/empleado/:id", autorizar(...GESTION), async (req, res) => {
    try {
        const resultado = await controlador.monitorearEmpleado(req.params.id, req.query.desde, req.query.hasta);
        if (resultado.exito) {
            res.json(resultado.datos);
        } else {
            res.status(400).json({ error: resultado.mensaje });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

const express = require("express");

const controlador = require("../app/controladorHorarios");
const repositorio = require("../datos/repositorioHorarios");

const { autorizar, autorizarPropio } = require("../../../../middlewares/autorizar");

const router = express.Router();

const GESTION = ["Administrador", "Contadora"];

// GET /api/horarios/turnos -> lista de turnos disponibles
router.get("/turnos", async (req, res) => {
    try {
        res.json(await repositorio.obtenerTurnos());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/horarios/turnos -> crea un turno
// body: { "nombre": "Diurno", "horaEntrada": "08:00", "horaSalida": "17:00", "dias": "1,2,3,4,5" }
router.post("/turnos", autorizar("Administrador"), async (req, res) => {
    try {
        const resultado = await controlador.registrarTurno(req.body);
        if (resultado.exito) {
            res.status(201).json(resultado.datos);
        } else {
            res.status(400).json({ error: resultado.mensaje });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/horarios/asignaciones -> asigna un turno a un empleado
// body: { "empleadoId": 1, "turnoId": 1, "fechaDesde": "2026-01-01", "fechaHasta": "2026-12-31" }
router.post("/asignaciones", autorizar("Administrador"), async (req, res) => {
    try {
        const resultado = await controlador.asignarHorario(req.body);
        if (resultado.exito) {
            res.status(201).json(resultado.datos);
        } else {
            res.status(400).json({ error: resultado.mensaje });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/horarios/empleado/:id -> horarios asignados a un empleado
router.get("/empleado/:id", autorizarPropio(...GESTION), async (req, res) => {
    try {
        res.json(await controlador.horarioDeEmpleado(Number(req.params.id)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/horarios/empleado/:id/hoy -> turno vigente hoy
router.get("/empleado/:id/hoy", autorizarPropio(...GESTION), async (req, res) => {
    try {
        res.json(await controlador.horarioDeHoy(Number(req.params.id), req.query.fecha));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/horarios/empleado/:id/semana -> grilla de la semana (lunes a domingo)
router.get("/empleado/:id/semana", autorizarPropio(...GESTION), async (req, res) => {
    try {
        res.json(await controlador.semanaDeEmpleado(Number(req.params.id), req.query.fecha));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

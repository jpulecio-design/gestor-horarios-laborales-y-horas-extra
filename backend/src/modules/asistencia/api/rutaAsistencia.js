const express = require("express");

const controlador = require("../app/controladorAsistencia");
const repositorio = require("../datos/repositorioAsistencia");

const { autorizar, autorizarPropio } = require("../../../../middlewares/autorizar");

const router = express.Router();

const GESTION = ["Administrador", "Contadora"];

// GET /api/asistencia -> todos los marcajes
router.get("/", autorizar(...GESTION), async (req, res) => {
    try {
        res.json(await repositorio.obtenerTodos());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/asistencia/qr -> registrar marcaje por QR
router.post("/qr", autorizar("Empleado", "Administrador", "Contadora"), async (req, res) => {
    try {
        const resultado = await controlador.registrarPorQr(req.body.codigoQr);
        if (resultado.exito) {
            res.status(201).json(resultado.datos);
        } else {
            res.status(400).json({ error: resultado.mensaje });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/asistencia/:id -> corregir marcaje (CU10)
router.put("/:id", autorizar(...GESTION), async (req, res) => {
    try {
        const resultado = await controlador.corregirRegistro(req.params.id, req.body);
        if (resultado.exito) {
            res.json(resultado.datos);
        } else {
            res.status(400).json({ error: resultado.mensaje });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/asistencia/empleado/:id -> marcajes de un empleado
router.get("/empleado/:id", autorizarPropio(...GESTION), async (req, res) => {
    try {
        res.json(await repositorio.obtenerPorEmpleado(Number(req.params.id)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/asistencia/empleado/:id/qr -> obtener QR de un empleado
router.get("/empleado/:id/qr", autorizarPropio(...GESTION), async (req, res) => {
    try {
        const resultado = await controlador.obtenerQrDeEmpleado(Number(req.params.id));
        if (resultado === null) {
            res.status(404).json({ error: "No existe un empleado con ese id." });
        } else {
            res.json(resultado);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/asistencia/empleado/:id/horas-trabajadas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
router.get("/empleado/:id/horas-trabajadas", autorizarPropio(...GESTION), async (req, res) => {
    try {
        const resultado = await controlador.obtenerHorasTrabajadas(req.params.id, req.query.desde, req.query.hasta);
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

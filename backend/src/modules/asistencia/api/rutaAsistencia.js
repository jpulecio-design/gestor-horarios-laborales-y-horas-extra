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

// GET /api/asistencia/empleado/:id -> marcajes de un empleado
router.get("/empleado/:id", autorizarPropio(...GESTION), async (req, res) => {
    try {
        res.json(await repositorio.obtenerPorEmpleado(Number(req.params.id)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/asistencia/empleado/:id/qr -> codigo e imagen QR del empleado
router.get("/empleado/:id/qr", autorizarPropio(...GESTION), async (req, res) => {
    try {
        const qr = await controlador.obtenerQrDeEmpleado(Number(req.params.id));
        if (qr === null) {
            res.status(404).json({ error: "No existe un empleado con ese id." });
        } else {
            res.json(qr);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/asistencia/qr -> registra entrada/salida escaneando un QR
// body: { "codigoQr": "EMPQR-..." }
router.post("/qr", autorizar("Administrador", "Contadora", "Empleado"), async (req, res) => {
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

// PUT /api/asistencia/:id -> corrige un marcaje (CU10)
// body (parcial): { "tipo": "Salida", "fechaHora": "2026-08-10 08:03:00",
//                   "observacion": "llegó tarde", "estado": "Activo" }
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

module.exports = router;

const express = require("express");

const controlador = require("../app/controladorAsistencia");
const repositorio = require("../datos/repositorioAsistencia");

const router = express.Router();

// GET /api/asistencia -> todos los marcajes
router.get("/", async (req, res) => {
    try {
        res.json(await repositorio.obtenerTodos());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/asistencia/empleado/:id -> marcajes de un empleado
router.get("/empleado/:id", async (req, res) => {
    try {
        res.json(await repositorio.obtenerPorEmpleado(Number(req.params.id)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/asistencia/empleado/:id/qr -> codigo e imagen QR del empleado
router.get("/empleado/:id/qr", async (req, res) => {
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
router.post("/qr", async (req, res) => {
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

module.exports = router;

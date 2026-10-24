const express = require("express");

const controlador = require("../app/controladorReportes");

const { autorizar } = require("../../../../middlewares/autorizar");

const router = express.Router();

const GESTION = ["Administrador", "Contadora"];

// GET /api/reportes/monitoreo.xlsx?desde=AAAA-MM-DD&hasta=AAAA-MM-DD
// Descarga un libro de Excel con las hojas Resumen, Horas extra y Asistencia.
router.get("/monitoreo.xlsx", autorizar(...GESTION), async (req, res) => {
    try {
        const resultado = await controlador.exportarReporte(req.query.desde, req.query.hasta);

        if (!resultado.exito) {
            res.status(400).json({ error: resultado.mensaje });
            return;
        }

        res.setHeader("Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition",
            "attachment; filename=\"" + resultado.datos.nombreArchivo + "\"");
        res.send(Buffer.from(resultado.datos.buffer));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

const express = require("express");

const controlador = require("../app/controladorRelevos");
const repositorio = require("../datos/repositorioRelevos");
const { autorizar } = require("../../../../middlewares/autorizar");

const router = express.Router();

router.get("/companeros", autorizar("Administrador", "Contadora", "Empleado"), async (req, res) => {
    try {
        res.json(await repositorio.obtenerCompanerosActivos(Number(req.usuario.id)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/agenda/:empleadoId", async (req, res) => {
    try {
        res.json(await controlador.agendaDeEmpleado(
            Number(req.params.empleadoId),
            req.query.dias === undefined ? undefined : Number(req.query.dias)
        ));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// solicitudes que envio
router.get("/enviadas/:empleadoId", async (req, res) => {
    try {
        res.json(await controlador.relevosEnviados(Number(req.params.empleadoId)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//solicitudes que le pidieron cubrir
router.get("/recibidas/:empleadoId", async (req, res) => {
    try {
        res.json(await controlador.relevosRecibidos(Number(req.params.empleadoId)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// una solicitud puntual
router.get("/:id", async (req, res) => {
    try {
        const solicitud = await repositorio.buscarSolicitudPorId(Number(req.params.id));
        if (solicitud === null) {
            res.status(404).json({ error: "No existe una solicitud con ese id." });
        } else {
            res.json(solicitud);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// solicita un relevo
router.post("/", async (req, res) => {
    try {
        const resultado = await controlador.solicitarRelevo(req.body);
        if (resultado.exito) {
            res.status(201).json(resultado.datos);
        } else {
            res.status(400).json({ error: resultado.mensaje });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//confirma o rechaza
router.patch("/:id/respuesta", async (req, res) => {
    try {
        const resultado = await controlador.responderRelevo({
            idSolicitud: Number(req.params.id),
            idEmpleado: req.body.idEmpleado,
            respuesta: req.body.respuesta
        });
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
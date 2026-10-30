const express = require("express");
const multer = require("multer");

const controlador = require("../app/controladorHorarios");
const controladorProgramacion = require("../app/controladorProgramacion");
const repositorio = require("../datos/repositorioHorarios");

const { autorizar, autorizarPropio } = require("../../../../middlewares/autorizar");

const router = express.Router();

const GESTION = ["Administrador", "Contadora"];

const subida = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

function recibirArchivo(req, res, next) {
    subida.single("archivo")(req, res, function (error) {
        if (!error) {
            return next();
        }
        const mensaje = error.code === "LIMIT_FILE_SIZE"
            ? "El archivo supera el límite de 5 MB."
            : "No se pudo recibir el archivo: " + error.message;
        res.status(400).json({ error: mensaje });
    });
}

router.get("/turnos", async (req, res) => {
    try {
        res.json(await repositorio.obtenerTurnos());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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

router.delete("/asignaciones/:id", autorizar("Administrador"), async (req, res) => {
    try {
        const resultado = await controlador.desactivarAsignacion(req.params.id);
        if (resultado.exito) {
            res.json({ mensaje: resultado.mensaje });
        } else {
            res.status(resultado.noEncontrado ? 404 : 400).json({ error: resultado.mensaje });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/asignaciones/:id/reactivar", autorizar("Administrador"), async (req, res) => {
    try {
        const resultado = await controlador.reactivarAsignacion(req.params.id);
        if (resultado.exito) {
            res.json({ mensaje: resultado.mensaje });
        } else {
            res.status(resultado.noEncontrado ? 404 : 400).json({ error: resultado.mensaje });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete("/base/:empleadoId/:fecha", autorizar("Administrador"), async (req, res) => {
    try {
        const resultado = await controlador.quitarDiaBase(req.params.empleadoId, req.params.fecha);
        if (resultado.exito) {
            res.json({ mensaje: resultado.mensaje });
        } else {
            res.status(resultado.noEncontrado ? 404 : 400).json({ error: resultado.mensaje });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/empleado/:id", autorizarPropio(...GESTION), async (req, res) => {
    try {
        res.json(await controlador.horarioDeEmpleado(Number(req.params.id)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/empleado/:id/hoy", autorizarPropio(...GESTION), async (req, res) => {
    try {
        res.json(await controlador.horarioDeHoy(Number(req.params.id), req.query.fecha));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/empleado/:id/semana", autorizarPropio(...GESTION), async (req, res) => {
    try {
        res.json(await controlador.semanaDeEmpleado(Number(req.params.id), req.query.fecha));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/tipos-turno", (req, res) => {
    res.json(controladorProgramacion.tiposTurno());
});

router.get("/programacion/:id", autorizarPropio(...GESTION), async (req, res) => {
    try {
        const resultado = await controladorProgramacion.consultarProgramacion(
            req.params.id, req.query.desde, req.query.hasta);
        if (resultado.exito) {
            res.json(resultado.datos);
        } else {
            res.status(400).json({ error: resultado.mensaje });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/programacion/:empleadoId", autorizar("Administrador"), async (req, res) => {
    try {
        const resultado = await controladorProgramacion.programarDias(
            req.params.empleadoId, req.body ? req.body.dias : undefined);
        if (resultado.exito) {
            res.json({ mensaje: resultado.mensaje, ...resultado.datos });
        } else {
            res.status(400).json({ error: resultado.mensaje, errores: resultado.errores });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete("/programacion/:empleadoId/:fecha", autorizar("Administrador"), async (req, res) => {
    try {
        const resultado = await controladorProgramacion.eliminarDia(req.params.empleadoId, req.params.fecha);
        if (resultado.exito) {
            res.json({ mensaje: resultado.mensaje });
        } else {
            res.status(resultado.noEncontrado ? 404 : 400).json({ error: resultado.mensaje });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/importar", autorizar("Administrador"), recibirArchivo, async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Falta el archivo (campo \"archivo\")." });
    }

    if (!req.file.originalname.toLowerCase().endsWith(".xlsx")) {
        return res.status(400).json({ error: "El archivo debe ser un .xlsx." });
    }

    try {
        const resultado = await controladorProgramacion.importarProgramacion(req.file.buffer);
        if (resultado.exito) {
            res.status(201).json({ mensaje: resultado.mensaje, ...resultado.datos });
        } else {
            res.status(400).json({ error: resultado.mensaje, errores: resultado.errores });
        }
    } catch (error) {
        const estado = error.esArchivoInvalido ? 400 : 500;
        res.status(estado).json({ error: error.message });
    }
});

module.exports = router;

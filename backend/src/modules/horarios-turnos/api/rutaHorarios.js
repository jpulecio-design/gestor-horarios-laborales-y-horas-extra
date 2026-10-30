const express = require("express");
const multer = require("multer");

const controlador = require("../app/controladorHorarios");
const controladorProgramacion = require("../app/controladorProgramacion");
const repositorio = require("../datos/repositorioHorarios");

const { autorizar, autorizarPropio } = require("../../../../middlewares/autorizar");

const router = express.Router();

const GESTION = ["Administrador", "Contadora"];

// El archivo se guarda en memoria (no en disco) y solo se acepta un .xlsx de hasta 5 MB
const subida = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Recibe el campo "archivo" y convierte los errores de multer (ej. archivo muy grande)
// en un 400 con JSON, en lugar de la pagina HTML de error por defecto de Express.
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

// DELETE /api/horarios/asignaciones/:id -> desactiva la asignacion (queda en el historial)
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

// PUT /api/horarios/asignaciones/:id/reactivar -> vuelve a activar una asignacion desactivada
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

// DELETE /api/horarios/base/:empleadoId/:fecha -> quita el turno base de UN solo dia
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

// ==================== CU04: programacion diaria (HORARIO_ASIGNADO) ====================

// GET /api/horarios/tipos-turno -> catalogo de tipos permitidos
router.get("/tipos-turno", (req, res) => {
    res.json(controladorProgramacion.tiposTurno());
});

// GET /api/horarios/programacion/:id?desde=AAAA-MM-DD&hasta=AAAA-MM-DD
// Dias programados del empleado en el periodo (semana, mes...).
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

// PUT /api/horarios/programacion/:empleadoId -> crea o actualiza dias de la programacion
// body: { "dias": [ { "fecha": "2026-11-02", "horaEntrada": "22:00", "horaSalida": "06:00", "tipoTurno": "Nocturno" } ] }
// Todo o nada: si un dia tiene error o se solapa, no se guarda ninguno.
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

// DELETE /api/horarios/programacion/:empleadoId/:fecha -> quita el turno de ese dia
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

// POST /api/horarios/importar -> importa la plantilla de programacion desde Excel (campo "archivo")
// Columnas (fila 1): empleadoId, fecha, horaEntrada, horaSalida, tipoTurno
// 201 -> resumen de lo guardado; 400 -> errores con fila y columna (no guarda nada)
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
        // archivo que no es un Excel legible (400) o error de base de datos (500)
        const estado = error.esArchivoInvalido ? 400 : 500;
        res.status(estado).json({ error: error.message });
    }
});

module.exports = router;

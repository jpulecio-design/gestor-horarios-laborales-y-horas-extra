const express = require("express");

const controlador = require("../controladores/controladorEmpleados");
const repositorio = require("../repositorios/repositorioEmpleados");
const estado = require("../repositorios/estado");

const router = express.Router();

// GET /api/empleados -> todos los empleados
router.get("/", (req, res) => {
    res.json(repositorio.obtenerTodos());
});

// GET /api/empleados/:id -> un empleado por id
router.get("/:id", (req, res) => {
    const empleado = repositorio.buscarEmpleadoPorId(Number(req.params.id));
    if (empleado === null) {
        res.status(404).json({ error: "No existe un empleado con ese id." });
    } else {
        res.json(empleado);
    }
});

// POST /api/empleados -> registra un empleado
// el controlador imprime y devuelve true/false; con el contador localizamos el recien creado
router.post("/", (req, res) => {
    const guardado = controlador.registrarEmpleado(req.body);
    if (!guardado) {
        res.status(400).json({ error: "No se pudo registrar. Completa todos los campos obligatorios." });
        return;
    }

    const nuevo = repositorio.buscarEmpleadoPorId(estado.contadorId - 1);
    res.status(201).json(nuevo);
});

// PUT /api/empleados/:id -> edita un empleado
router.put("/:id", (req, res) => {
    const editado = controlador.guardarEdicion(Number(req.params.id), req.body);
    if (!editado) {
        res.status(400).json({ error: "No se pudo editar el empleado." });
        return;
    }

    res.json(repositorio.buscarEmpleadoPorId(Number(req.params.id)));
});

module.exports = router;
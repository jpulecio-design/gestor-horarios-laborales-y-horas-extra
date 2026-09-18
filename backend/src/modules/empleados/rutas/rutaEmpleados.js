const express = require("express");

const controlador = require("../controladores/controladorEmpleados");

const repositorio = require("../repositorios/repositorioEmpleados");

const router = express.Router();

// GET /api/empleados
// Devuelve todos los empleados

router.get("/", (req, res) => {

    repositorio.obtenerTodos()
        .then(function (empleados) {
            res.json(empleados);
        })
        .catch(function (error) {
            res.status(500).json({
                error: error.message
            });
        });

});

// GET /api/empleados/:id
// Devuelve un empleado por ID

router.get("/:id", (req, res) => {

    repositorio.buscarEmpleadoPorId(Number(req.params.id))
        .then(function (empleado) {

            if (empleado === null) {

                res.status(404).json({
                    error: "No existe un empleado con ese id."
                });

            } else {

                res.json(empleado);

            }

        })
        .catch(function (error) {

            res.status(500).json({
                error: error.message
            });

        });

});

// POST /api/empleados
// Registra un empleado nuevo

router.post("/", (req, res) => {

    controlador.registrarEmpleado(req.body)
        .then(function (resultado) {

            if (!resultado) {

                res.status(400).json({
                    error: "No se pudo registrar. Completa todos los campos obligatorios."
                });

                return;
            }

            // resultado contiene el ID real generado por Oracle
            return repositorio.buscarEmpleadoPorId(resultado)
                .then(function (nuevo) {

                    res.status(201).json(nuevo);

                });

        })
        .catch(function (error) {

            res.status(500).json({
                error: error.message
            });

        });

});

// PUT /api/empleados/:id
// Edita un empleado

router.put("/:id", (req, res) => {

    controlador.guardarEdicion(
        Number(req.params.id),
        req.body
    )
        .then(function (editado) {

            if (!editado) {

                res.status(400).json({
                    error: "No se pudo editar el empleado."
                });

                return;
            }

            return repositorio.buscarEmpleadoPorId(
                Number(req.params.id)
            )
                .then(function (empleado) {

                    res.json(empleado);

                });

        })
        .catch(function (error) {

            res.status(500).json({
                error: error.message
            });

        });

});

module.exports = router;
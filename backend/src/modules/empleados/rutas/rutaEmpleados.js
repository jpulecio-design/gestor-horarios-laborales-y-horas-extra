const express = require("express");

const controlador = require("../controladores/controladorEmpleados");

const repositorio = require("../repositorios/repositorioEmpleados");

const { autorizar } = require("../../../../middlewares/autorizar");

const router = express.Router();

const ADMINISTRADOR = "Administrador";
const LECTURA_EMPLEADOS = ["Administrador", "Contadora"];

// quita el hash de la contraseña para que nunca salga del servidor
function sinContrasena(empleado) {
    if (empleado === null || empleado === undefined) {
        return empleado;
    }
    let copia = Object.assign({}, empleado);
    copia.usuario = Object.assign({}, empleado.usuario);
    delete copia.usuario.contrasena;
    return copia;
}

// GET /api/empleados
// Devuelve todos los empleados

router.get("/", autorizar(...LECTURA_EMPLEADOS), (req, res) => {

    repositorio.obtenerTodos()
        .then(function (empleados) {
            res.json(empleados.map(sinContrasena));
        })
        .catch(function (error) {
            res.status(500).json({
                error: error.message
            });
        });

});

// GET /api/empleados/:id
// Devuelve un empleado por ID

router.get("/:id", autorizar(...LECTURA_EMPLEADOS), (req, res) => {

    repositorio.buscarEmpleadoPorId(Number(req.params.id))
        .then(function (empleado) {

            if (empleado === null) {

                res.status(404).json({
                    error: "No existe un empleado con ese id."
                });

            } else {

                res.json(sinContrasena(empleado));

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

router.post("/", autorizar(ADMINISTRADOR), (req, res) => {

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

                    res.status(201).json(sinContrasena(nuevo));

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

router.put("/:id", autorizar(ADMINISTRADOR), (req, res) => {

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

                    res.json(sinContrasena(empleado));

                });

        })
        .catch(function (error) {

            res.status(500).json({
                error: error.message
            });

        });

});

module.exports = router;
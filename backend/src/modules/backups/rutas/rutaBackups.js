const express = require("express");

const controlador = require("../controladores/controladorBackups");

const soloAdministrador = require("../../auth/compartido/soloAdministrador");

const router = express.Router();

router.use(soloAdministrador);

function idDesdeUrl(req) {
    let id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }
    return id;
}

router.get("/", (req, res) => {

    controlador.consultarEstado()
        .then(function (estado) {
            res.json(estado);
        })
        .catch(function (error) {
            res.status(500).json({
                error: error.message
            });
        });

});

router.post("/", (req, res) => {

    controlador.generarBackupManual(req.usuario.id)
        .then(function (resultado) {

            if (!resultado.exito) {
                res.status(500).json({
                    error: resultado.mensaje
                });
                return;
            }

            res.status(201).json(resultado.datos);
        });

});

router.get("/:id/descarga", (req, res) => {

    let id = idDesdeUrl(req);
    if (id === null) {
        res.status(400).json({ error: "El id del respaldo es inválido." });
        return;
    }

    controlador.obtenerArchivoDescarga(id)
        .then(function (resultado) {

            if (!resultado.exito) {
                res.status(resultado.codigo).json({
                    error: resultado.mensaje
                });
                return;
            }

            res.download(resultado.ruta, resultado.nombreArchivo);
        })
        .catch(function (error) {
            res.status(500).json({
                error: error.message
            });
        });

});

router.get("/:id/excel", (req, res) => {

    let id = idDesdeUrl(req);
    if (id === null) {
        res.status(400).json({ error: "El id del respaldo es inválido." });
        return;
    }

    controlador.obtenerExcelDescarga(id)
        .then(function (resultado) {

            if (!resultado.exito) {
                res.status(resultado.codigo).json({
                    error: resultado.mensaje
                });
                return;
            }

            res.attachment(resultado.nombreArchivo);
            return resultado.libro.xlsx.write(res)
                .then(function () {
                    res.end();
                });
        })
        .catch(function (error) {
            if (res.headersSent) {
                res.end();
                return;
            }
            res.status(500).json({
                error: error.message
            });
        });

});

router.get("/:id/comparacion", (req, res) => {

    let id = idDesdeUrl(req);
    if (id === null) {
        res.status(400).json({ error: "El id del respaldo es inválido." });
        return;
    }

    controlador.compararConRespaldo(id)
        .then(function (resultado) {

            if (!resultado.exito) {
                res.status(resultado.codigo).json({
                    error: resultado.mensaje
                });
                return;
            }

            res.json(resultado.datos);
        })
        .catch(function (error) {
            res.status(500).json({
                error: error.message
            });
        });

});

module.exports = router;

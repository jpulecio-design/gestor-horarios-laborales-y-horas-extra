const servicioAutenticacion = require("./servicioAutenticacion");

function noAutenticado(res, mensaje) {
    res.set("WWW-Authenticate", 'Basic realm="Seguridad y Backups"');
    res.status(401).json({ error: mensaje });
}

function soloAdministrador(req, res, next) {
    let encabezado = req.headers.authorization || "";

    if (!encabezado.startsWith("Basic ")) {
        noAutenticado(res, "Debes iniciar sesión como Administrador.");
        return;
    }

    let texto = Buffer.from(encabezado.slice(6), "base64").toString("utf8");
    let separador = texto.indexOf(":");
    if (separador === -1) {
        noAutenticado(res, "Credenciales mal formadas.");
        return;
    }

    let correo = texto.slice(0, separador);
    let clave = texto.slice(separador + 1);

    return servicioAutenticacion.iniciarSesion(correo, clave)
        .then(function (resultado) {
            if (!resultado.exito) {
                noAutenticado(res, resultado.mensaje);
                return;
            }

            if (resultado.usuario.rol !== "Administrador") {
                res.status(403).json({ error: "Solo el Administrador puede acceder a Seguridad y Backups." });
                return;
            }

            req.usuario = resultado.usuario;
            next();
        })
        .catch(function (error) {
            res.status(500).json({ error: error.message });
        });
}

module.exports = soloAdministrador;

const servicioAutenticacion = require("./servicioAutenticacion");

async function iniciarSesion(req, res) {
    try {
        const { username, password } = req.body;
        const resultado = await servicioAutenticacion.iniciarSesion(username, password);
        res.json(resultado);
    } catch (error) {
        if (!error.statusCode) {
            console.error("Error al iniciar sesion:", error);
            return res.status(500).json({ error: "No se pudo validar el inicio de sesion." });
        }
        res.status(error.statusCode).json({ error: error.message });
    }
}

async function solicitarRecuperacion(req, res) {
    try {
        const resultado = await servicioAutenticacion.solicitarRecuperacion(req.body.correo);
        res.json(resultado);
    } catch (error) {
        if (!error.statusCode) {
            console.error("Error al enviar codigo de recuperacion:", error);
            return res.status(503).json({ error: "No se pudo enviar el código. Revisa la configuración del correo e intenta de nuevo." });
        }
        res.status(error.statusCode).json({ error: error.message });
    }
}

async function restablecerContrasena(req, res) {
    try {
        const resultado = await servicioAutenticacion.restablecerContrasena(
            req.body.correo,
            req.body.codigo,
            req.body.contrasenaNueva
        );
        res.json(resultado);
    } catch (error) {
        if (!error.statusCode) {
            console.error("Error al restablecer contrasena:", error);
            return res.status(500).json({ error: "No se pudo restablecer la contraseña." });
        }
        res.status(error.statusCode).json({ error: error.message });
    }
}

module.exports = {
    iniciarSesion: iniciarSesion,
    solicitarRecuperacion: solicitarRecuperacion,
    restablecerContrasena: restablecerContrasena
};

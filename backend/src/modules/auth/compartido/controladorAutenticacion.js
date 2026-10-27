const servicioAutenticacion = require("./servicioAutenticacion");

async function iniciarSesion(req, res) {
    try {
        const { username, password } = req.body;
        const resultado = await servicioAutenticacion.iniciarSesion(username, password);
        res.json(resultado);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
}

async function cambiarContrasena(req, res) {
    try {
        const resultado = await servicioAutenticacion.cambiarContrasena(
            req.usuario.id,
            req.body.contrasenaActual,
            req.body.contrasenaNueva
        );
        res.json(resultado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

module.exports = {
    iniciarSesion: iniciarSesion,
    cambiarContrasena: cambiarContrasena
};

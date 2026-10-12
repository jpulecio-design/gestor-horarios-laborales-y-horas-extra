const servicioAutenticacion = require("./servicioAutenticacion");

async function iniciarSesion(req, res) {

    const { username, password } = req.body || {};

    if (!username || !password) {
        res.status(400).json({
            exito: false,
            mensaje: "Usuario y contraseña son obligatorios"
        });
        return;
    }

    try {
        const resultado = await servicioAutenticacion.iniciarSesion(
            username,
            password
        );

        res.json(resultado);
    } catch (error) {
        res.status(500).json({
            exito: false,
            mensaje: "Error al iniciar sesión"
        });
    }
}

module.exports = {
    iniciarSesion
};

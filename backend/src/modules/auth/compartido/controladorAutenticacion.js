const servicioAutenticacion = require("./servicioAutenticacion");
const repositorioUsuarios = require("./repositorioUsuarios");

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

// Perfil del usuario que trae el token (req.usuario lo deja el middleware autenticar).
async function perfil(req, res) {

    try {
        const usuario = await repositorioUsuarios.buscarPorId(req.usuario.id);

        if (!usuario) {
            res.status(404).json({
                exito: false,
                mensaje: "No se encontró el perfil del usuario."
            });
            return;
        }

        res.json({
            exito: true,
            usuario: usuario
        });
    } catch (error) {
        res.status(500).json({
            exito: false,
            mensaje: "No se pudo obtener el perfil."
        });
    }
}

module.exports = {
    iniciarSesion,
    perfil
};

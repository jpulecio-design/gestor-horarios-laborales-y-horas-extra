const repositorioUsuarios = require(
    "./repositorioUsuarios"
);

const seguridad = require("./seguridad");

async function iniciarSesion(username, password) {

    const usuario = await repositorioUsuarios.buscarPorUsername(username);

    if (!usuario) {
        return {
            exito: false,
            mensaje: "Usuario o contraseña incorrectos"
        };
    }

    if (!seguridad.verificarContrasena(password, usuario.password)) {
        return {
            exito: false,
            mensaje: "Usuario o contraseña incorrectos"
        };
    }

    if (usuario.estado !== "Activo") {
        return {
            exito: false,
            mensaje: "La cuenta está inactiva"
        };
    }

    const sesion = {
        id: usuario.id,
        username: usuario.username,
        rol: usuario.rol
    };

    return {
        exito: true,
        mensaje: "Inicio de sesión exitoso",
        token: seguridad.firmarToken(sesion),
        usuario: sesion
    };
}

module.exports = {
    iniciarSesion
};

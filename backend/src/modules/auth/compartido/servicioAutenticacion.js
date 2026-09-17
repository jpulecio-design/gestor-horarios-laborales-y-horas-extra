const repositorioUsuarios = require(
    "./repositorioUsuarios"
);

async function iniciarSesion(username, password) {

    const usuario = await repositorioUsuarios.buscarPorUsername(username);

    if (!usuario) {
        return {
            exito: false,
            mensaje: "Usuario o contraseña incorrectos"
        };
    }

    if (usuario.password !== password) {
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

    return {
        exito: true,
        mensaje: "Inicio de sesión exitoso",
        usuario: {
            id: usuario.id,
            username: usuario.username,
            rol: usuario.rol
        }
    };
}

module.exports = {
    iniciarSesion
};
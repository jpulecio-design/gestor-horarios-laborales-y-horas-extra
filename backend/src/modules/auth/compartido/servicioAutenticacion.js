const repositorioUsuarios = require("./repositorioUsuarios");
const seguridad = require("./seguridad");

async function iniciarSesion(username, password) {
    if (!username || !password) {
        throw new Error("Se requieren usuario y contrasena.");
    }

    const usuario = await repositorioUsuarios.buscarPorUsername(username);

    if (usuario === null || usuario.estado !== "Activo") {
        throw new Error("Credenciales invalidas.");
    }

    const esValida = await seguridad.verificarContrasena(password, usuario.password);

    if (!esValida) {
        throw new Error("Credenciales invalidas.");
    }

    const token = seguridad.generarToken({
        id: usuario.id,
        username: usuario.username,
        rol: usuario.rol
    });

    return {
        token: token,
        usuario: {
            id: usuario.id,
            username: usuario.username,
            rol: usuario.rol
        }
    };
}

async function cambiarContrasena(usuarioId, contrasenaActual, contrasenaNueva) {
    if (!usuarioId || !contrasenaActual || !contrasenaNueva) {
        throw new Error("Se requieren contrasena actual y nueva.");
    }

    if (String(contrasenaNueva).length < 6) {
        throw new Error("La nueva contrasena debe tener al menos 6 caracteres.");
    }

    const usuario = await repositorioUsuarios.buscarPorId(usuarioId);
    if (usuario === null || usuario.estado !== "Activo") {
        throw new Error("Usuario no válido.");
    }

    const esValida = await seguridad.verificarContrasena(contrasenaActual, usuario.password);
    if (!esValida) {
        throw new Error("La contrasena actual es incorrecta.");
    }

    const nuevaHash = await seguridad.hashearContrasena(contrasenaNueva);
    await repositorioUsuarios.actualizarContrasena(usuarioId, nuevaHash);
    return { exito: true, mensaje: "Contrasena actualizada correctamente." };
}

module.exports = {
    iniciarSesion: iniciarSesion,
    cambiarContrasena: cambiarContrasena
};

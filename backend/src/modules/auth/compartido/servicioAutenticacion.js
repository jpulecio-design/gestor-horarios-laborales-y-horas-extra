const repositorioUsuarios = require("./repositorioUsuarios");
const seguridad = require("./seguridad");
const servicioCorreo = require("./servicioCorreo");
const crypto = require("crypto");

const DURACION_CODIGO_MS = 10 * 60 * 1000;
const TIEMPO_ENTRE_SOLICITUDES_MS = 60 * 1000;
const solicitudesRecientes = new Map();

function crearErrorAutenticacion(mensaje, statusCode) {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    return error;
}

async function iniciarSesion(username, password) {
    if (!username || !password) {
        throw crearErrorAutenticacion("Se requieren usuario y contrasena.", 400);
    }

    const usuario = await repositorioUsuarios.buscarPorUsername(username);

    if (usuario === null || usuario.estado !== "Activo") {
        throw crearErrorAutenticacion("Credenciales invalidas.", 401);
    }

    const esValida = await seguridad.verificarContrasena(password, usuario.password);

    if (!esValida) {
        throw crearErrorAutenticacion("Credenciales invalidas.", 401);
    }

    const token = seguridad.firmarToken({
        id: usuario.id,
        username: usuario.username,
        rol: usuario.rol
    });

    return {
        exito: true,
        token: token,
        usuario: {
            id: usuario.id,
            username: usuario.username,
            rol: usuario.rol
        }
    };
}

function hashCodigoRecuperacion(id, codigo) {
    const secreto = process.env.RECUPERACION_SECRET;
    if (!secreto) {
        throw new Error("Configura RECUPERACION_SECRET en backend/.env.");
    }
    return crypto.createHmac("sha256", secreto).update(id + ":" + codigo).digest("hex");
}

async function solicitarRecuperacion(correo) {
    if (typeof correo !== "string" || correo.trim() === "") {
        throw crearErrorAutenticacion("Escribe el correo de tu cuenta.", 400);
    }

    const usuario = await repositorioUsuarios.buscarPorUsername(correo.trim());
    if (usuario === null || usuario.estado !== "Activo") {
        return {
            exito: true,
            mensaje: "Si el correo está registrado, recibirás un código para restablecer tu contraseña."
        };
    }

    const ahora = Date.now();
    for (const [correoGuardado, ultimaSolicitud] of solicitudesRecientes) {
        if (ahora - ultimaSolicitud >= TIEMPO_ENTRE_SOLICITUDES_MS) {
            solicitudesRecientes.delete(correoGuardado);
        }
    }
    const claveCorreo = usuario.username.toLowerCase();
    if (solicitudesRecientes.has(claveCorreo)) {
        return {
            exito: true,
            mensaje: "Si el correo está registrado, recibirás un código para restablecer tu contraseña."
        };
    }
    const codigo = String(crypto.randomInt(100000, 1000000));
    const codigoHash = hashCodigoRecuperacion(usuario.id, codigo);
    await repositorioUsuarios.guardarCodigoRecuperacion(
        usuario.id,
        codigoHash,
        new Date(ahora + DURACION_CODIGO_MS)
    );
    solicitudesRecientes.set(claveCorreo, ahora);

    try {
        await servicioCorreo.enviarCodigoRecuperacion(usuario.username, codigo);
    } catch (error) {
        solicitudesRecientes.delete(claveCorreo);
        throw error;
    }

    return {
        exito: true,
        mensaje: "Si el correo está registrado, recibirás un código para restablecer tu contraseña."
    };
}

async function restablecerContrasena(correo, codigo, contrasenaNueva) {
    if (typeof correo !== "string" || typeof codigo !== "string" || typeof contrasenaNueva !== "string") {
        throw crearErrorAutenticacion("Completa el correo, el código y la nueva contraseña.", 400);
    }
    if (!/^\d{6}$/.test(codigo)) {
        throw crearErrorAutenticacion("El código no es válido o ya venció.", 400);
    }
    if (contrasenaNueva.length < 6) {
        throw crearErrorAutenticacion("La nueva contraseña debe tener al menos 6 caracteres.", 400);
    }

    const usuario = await repositorioUsuarios.buscarPorUsername(correo.trim());
    if (usuario === null || usuario.estado !== "Activo") {
        throw crearErrorAutenticacion("El código no es válido o ya venció.", 400);
    }

    const codigoHash = hashCodigoRecuperacion(usuario.id, codigo);
    const nuevaContrasenaHash = await seguridad.hashearContrasena(contrasenaNueva);
    const actualizado = await repositorioUsuarios.cambiarContrasenaConCodigo(
        usuario.id,
        codigoHash,
        nuevaContrasenaHash
    );
    if (!actualizado) {
        throw crearErrorAutenticacion("El código no es válido o ya venció.", 400);
    }

    solicitudesRecientes.delete(usuario.username.toLowerCase());
    return { exito: true, mensaje: "Contraseña restablecida. Ya puedes iniciar sesión." };
}

module.exports = {
    iniciarSesion: iniciarSesion,
    solicitarRecuperacion: solicitarRecuperacion,
    restablecerContrasena: restablecerContrasena
};

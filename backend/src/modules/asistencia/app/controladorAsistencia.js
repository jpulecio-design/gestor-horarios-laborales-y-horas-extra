const QRCode = require("qrcode");

const registro = require("../dominio/registroAsistencia");
const repositorio = require("../datos/repositorioAsistencia");
const repositorioEmpleados = require("../../empleados/repositorios/repositorioEmpleados");

// Registra un marcaje a partir del codigo QR escaneado.
// Entrada y salida se alternan segun el ultimo marcaje del empleado.
// devuelve { exito: true, datos } o { exito: false, mensaje }
// los errores de base de datos se propagan como promesa rechazada.
async function registrarPorQr(codigoQr) {
    if (codigoQr === undefined || codigoQr === null || String(codigoQr).trim() === "") {
        return { exito: false, mensaje: "ERROR: el código QR es obligatorio." };
    }

    let codigo = String(codigoQr).trim();
    let empleado = await repositorioEmpleados.buscarEmpleadoPorCodigoQr(codigo);

    if (empleado === null) {
        return { exito: false, mensaje: "ERROR: el código QR no corresponde a ningún empleado." };
    }

    if (empleado.usuario.estado !== "Activo") {
        return { exito: false, mensaje: "ERROR: el empleado está inactivo, no se registra asistencia." };
    }

    let ultimo = await repositorio.obtenerUltimoPorEmpleado(empleado.usuario.id);
    let tipo = registro.siguienteTipo(ultimo);

    let nuevo = await repositorio.agregarRegistro(registro.crearRegistro({
        empleadoId: empleado.usuario.id,
        tipo: tipo,
        origen: "QR"
    }));

    return {
        exito: true,
        mensaje: tipo + " registrada para " +
            empleado.usuario.nombre + " " + empleado.usuario.apellido +
            " (id " + empleado.usuario.id + ").",
        datos: nuevo,
        empleado: {
            id: empleado.usuario.id,
            nombre: empleado.usuario.nombre,
            apellido: empleado.usuario.apellido
        }
    };
}

// Devuelve el codigo QR del empleado y su imagen (data URL PNG).
// Devuelve null si el empleado no existe.
async function obtenerQrDeEmpleado(empleadoId) {
    let codigo = await repositorioEmpleados.asegurarCodigoQr(empleadoId);

    if (codigo === null) {
        return null;
    }

    let imagen = await QRCode.toDataURL(codigo, { width: 320, margin: 1 });

    return { codigoQr: codigo, imagen: imagen };
}

module.exports = {
    registrarPorQr: registrarPorQr,
    obtenerQrDeEmpleado: obtenerQrDeEmpleado
};

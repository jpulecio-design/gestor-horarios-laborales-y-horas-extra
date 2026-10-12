const QRCode = require("qrcode");

const registro = require("../dominio/registroAsistencia");
const repositorio = require("../datos/repositorioAsistencia");
const repositorioEmpleados = require("../../empleados/repositorios/repositorioEmpleados");

const FORMATO_FECHA_HORA = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

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

// -------------------- CU10: corregir un marcaje --------------------
// Permite corregir tipo, fecha/hora, observacion y estado de un marcaje.
// Los campos que no se envian conservan su valor actual.
async function corregirRegistro(id, cambios) {
    let idNumero = Number(id);
    if (isNaN(idNumero) || idNumero <= 0) {
        return { exito: false, mensaje: "ERROR: el id del marcaje es inválido." };
    }

    let actual = await repositorio.buscarPorId(idNumero);
    if (actual === null) {
        return { exito: false, mensaje: "ERROR: no existe un marcaje con ese id." };
    }

    let tipo = actual.tipo;
    if (cambios.tipo !== undefined && cambios.tipo !== null && String(cambios.tipo).trim() !== "") {
        if (!registro.tipoValido(cambios.tipo)) {
            return { exito: false, mensaje: "ERROR: el tipo debe ser Entrada o Salida." };
        }
        tipo = cambios.tipo;
    }

    let fechaHora = actual.fechaHora;
    if (cambios.fechaHora !== undefined && cambios.fechaHora !== null && String(cambios.fechaHora).trim() !== "") {
        if (!FORMATO_FECHA_HORA.test(cambios.fechaHora)) {
            return { exito: false, mensaje: "ERROR: la fecha y hora debe ser AAAA-MM-DD HH:MM:SS." };
        }
        fechaHora = cambios.fechaHora;
    }

    let observacion = actual.observacion;
    if (cambios.observacion !== undefined) {
        observacion = (cambios.observacion === null || String(cambios.observacion).trim() === "")
            ? null
            : String(cambios.observacion).trim();
    }

    let estado = actual.estado;
    if (cambios.estado !== undefined && cambios.estado !== null && String(cambios.estado).trim() !== "") {
        if (!registro.estadoValido(cambios.estado)) {
            return { exito: false, mensaje: "ERROR: el estado debe ser Activo o Anulado." };
        }
        estado = cambios.estado;
    }

    let guardado = await repositorio.actualizarRegistro(idNumero, {
        tipo: tipo,
        fechaHora: fechaHora,
        observacion: observacion,
        estado: estado
    });

    return {
        exito: true,
        mensaje: "Marcaje " + idNumero + " corregido.",
        datos: guardado
    };
}

module.exports = {
    registrarPorQr: registrarPorQr,
    obtenerQrDeEmpleado: obtenerQrDeEmpleado,
    corregirRegistro: corregirRegistro
};

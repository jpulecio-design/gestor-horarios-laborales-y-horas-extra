const QRCode = require("qrcode");

const repositorio = require("../datos/repositorioAsistencia");
const repositorioEmpleados = require("../../empleados/repositorios/repositorioEmpleados");
const calculadorHorasTrabajadas = require("./calculadorHorasTrabajadas");

// Registra un marcaje por QR (CU03)
async function registrarPorQr(codigoQr) {
    if (!codigoQr || codigoQr.trim() === "") {
        return { exito: false, mensaje: "ERROR: el codigo QR es obligatorio." };
    }

    let empleado = await repositorioEmpleados.buscarPorCodigoQr(codigoQr.trim());

    if (empleado === null) {
        return { exito: false, mensaje: "ERROR: no existe un empleado con ese codigo QR." };
    }

    let ultimo = await repositorio.obtenerUltimoPorEmpleado(empleado.usuario.id);

    let tipo = "Entrada";
    if (ultimo !== null && ultimo.tipo === "Entrada") {
        tipo = "Salida";
    }

    let guardado = await repositorio.agregarRegistro({
        empleadoId: empleado.usuario.id,
        tipo: tipo,
        origen: "QR",
        observacion: null
    });

    return {
        exito: true,
        mensaje: "Marcaje registrado correctamente: " + tipo + " (#" + guardado.id + ").",
        datos: guardado
    };
}

// Obtiene el QR de un empleado para mostrarlo/descargarlo (CU03)
async function obtenerQrDeEmpleado(empleadoId) {
    let empleado = await repositorioEmpleados.buscarEmpleadoPorId(empleadoId);
    if (empleado === null) {
        return null;
    }
    return { codigoQr: empleado.codigoQr };
}

// Corrige un marcaje existente (CU10)
async function corregirRegistro(idAsistencia, datos) {
    if (!idAsistencia) {
        return { exito: false, mensaje: "ERROR: el id del marcaje es obligatorio." };
    }

    let id = Number(idAsistencia);
    if (isNaN(id) || id <= 0) {
        return { exito: false, mensaje: "ERROR: el id del marcaje es invalido." };
    }

    let actual = await repositorio.buscarPorId(id);
    if (actual === null) {
        return { exito: false, mensaje: "ERROR: no existe un marcaje con ese id." };
    }

    if (!datos.tipo || (datos.tipo !== "Entrada" && datos.tipo !== "Salida")) {
        return { exito: false, mensaje: "ERROR: el tipo debe ser Entrada o Salida." };
    }

    if (!datos.fechaHora || datos.fechaHora.trim() === "") {
        return { exito: false, mensaje: "ERROR: la fecha y hora son obligatorias." };
    }

    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(datos.fechaHora.trim())) {
        return { exito: false, mensaje: "ERROR: la fecha y hora deben tener formato AAAA-MM-DD HH24:MI:SS." };
    }

    if (!datos.estado || (datos.estado !== "Activo" && datos.estado !== "Anulado")) {
        return { exito: false, mensaje: "ERROR: el estado debe ser Activo o Anulado." };
    }

    let actualizado = await repositorio.actualizarRegistro(id, {
        tipo: datos.tipo,
        fechaHora: datos.fechaHora.trim(),
        observacion: datos.observacion ? datos.observacion.trim() : null,
        estado: datos.estado
    });

    return {
        exito: true,
        mensaje: "Marcaje #" + id + " corregido correctamente.",
        datos: actualizado
    };
}

async function obtenerHorasTrabajadas(empleadoId, desde, hasta) {
    if (!empleadoId || !desde || !hasta) {
        return { exito: false, mensaje: "ERROR: se requieren empleadoId, desde y hasta (YYYY-MM-DD)." };
    }
    const resultado = await calculadorHorasTrabajadas.calcularHorasTrabajadas(Number(empleadoId), desde, hasta);
    return { exito: true, datos: resultado };
}

module.exports = {
    registrarPorQr: registrarPorQr,
    obtenerQrDeEmpleado: obtenerQrDeEmpleado,
    corregirRegistro: corregirRegistro,
    obtenerHorasTrabajadas: obtenerHorasTrabajadas
};

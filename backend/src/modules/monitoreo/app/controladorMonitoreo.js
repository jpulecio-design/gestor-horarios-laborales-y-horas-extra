const monitoreo = require("../dominio/monitoreo");
const repositorio = require("../datos/repositorioMonitoreo");
const repositorioEmpleados = require("../../empleados/repositorios/repositorioEmpleados");

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Valida el periodo; devuelve un mensaje de error o null si esta bien.
function validarPeriodo(desde, hasta) {
    if (!FORMATO_FECHA.test(desde || "")) {
        return "ERROR: la fecha desde es obligatoria (AAAA-MM-DD).";
    }
    if (!FORMATO_FECHA.test(hasta || "")) {
        return "ERROR: la fecha hasta es obligatoria (AAAA-MM-DD).";
    }
    if (hasta < desde) {
        return "ERROR: la fecha hasta no puede ser anterior a la fecha desde.";
    }
    return null;
}

// Junta marcajes y horas extra de un empleado en un solo resumen.
async function monitorearEmpleado(empleadoId, desde, hasta) {
    let id = Number(empleadoId);
    if (isNaN(id) || id <= 0) {
        return { exito: false, mensaje: "ERROR: el id del empleado es inválido." };
    }

    let error = validarPeriodo(desde, hasta);
    if (error !== null) {
        return { exito: false, mensaje: error };
    }

    let empleado = await repositorioEmpleados.buscarEmpleadoPorId(id);
    if (empleado === null) {
        return { exito: false, mensaje: "ERROR: no existe un empleado con ese id." };
    }

    let marcajes = await repositorio.obtenerMarcajes(id, desde, hasta);
    let extras = await repositorio.obtenerHorasExtra(id, desde, hasta);

    return {
        exito: true,
        datos: {
            empleado: { id: id, nombre: empleado.usuario.nombre, apellido: empleado.usuario.apellido },
            periodo: { desde: desde, hasta: hasta },
            asistencia: monitoreo.resumirAsistencia(marcajes),
            horasExtra: monitoreo.resumirHorasExtra(extras),
            marcajes: marcajes,
            horasExtraDetalle: extras
        }
    };
}

// Resumen de todos los empleados del periodo.
async function monitorearGeneral(desde, hasta) {
    let error = validarPeriodo(desde, hasta);
    if (error !== null) {
        return { exito: false, mensaje: error };
    }

    let empleados = await repositorioEmpleados.obtenerTodos();
    let filas = [];

    for (let i = 0; i < empleados.length; i++) {
        let empleado = empleados[i];
        let id = empleado.usuario.id;

        let marcajes = await repositorio.obtenerMarcajes(id, desde, hasta);
        let extras = await repositorio.obtenerHorasExtra(id, desde, hasta);

        filas.push({
            empleado: { id: id, nombre: empleado.usuario.nombre, apellido: empleado.usuario.apellido },
            asistencia: monitoreo.resumirAsistencia(marcajes),
            horasExtra: monitoreo.resumirHorasExtra(extras)
        });
    }

    return { exito: true, datos: { periodo: { desde: desde, hasta: hasta }, empleados: filas } };
}

module.exports = {
    monitorearEmpleado: monitorearEmpleado,
    monitorearGeneral: monitorearGeneral
};

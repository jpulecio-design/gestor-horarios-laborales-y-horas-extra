const monitoreo = require("../../monitoreo/dominio/monitoreo");
const repositorioMonitoreo = require("../../monitoreo/datos/repositorioMonitoreo");
const repositorioEmpleados = require("../../empleados/repositorios/repositorioEmpleados");

// Los reportes se alimentan de los mismos datos que el monitoreo (CU07).
function obtenerEmpleados() {
    return repositorioEmpleados.obtenerTodos();
}

function obtenerMarcajes(empleadoId, desde, hasta) {
    return repositorioMonitoreo.obtenerMarcajes(empleadoId, desde, hasta);
}

function obtenerHorasExtra(empleadoId, desde, hasta) {
    return repositorioMonitoreo.obtenerHorasExtra(empleadoId, desde, hasta);
}

// El detalle por tipo de hora extra se calcula con el dominio de monitoreo.
function resumir(marcajes, extras) {
    return {
        asistencia: monitoreo.resumirAsistencia(marcajes),
        horasExtra: monitoreo.resumirHorasExtra(extras)
    };
}

module.exports = {
    obtenerEmpleados: obtenerEmpleados,
    obtenerMarcajes: obtenerMarcajes,
    obtenerHorasExtra: obtenerHorasExtra,
    resumir: resumir
};

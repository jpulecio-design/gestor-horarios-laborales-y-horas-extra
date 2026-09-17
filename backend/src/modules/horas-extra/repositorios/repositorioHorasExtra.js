const estado = require("./estado");

// agrega una hora extra al final del array
function agregarHoraExtra(horaExtra) {
    estado.horasExtras.push(horaExtra);
}

// devuelve el array con todas las horas extra
function obtenerTodas() {
    return estado.horasExtras;
}

// devuelve la hora extra que tenga ese id o null si no existe
function buscarPorId(id) {
    for (let i = 0; i < estado.horasExtras.length; i++) {
        if (estado.horasExtras[i].id === id) {
            return estado.horasExtras[i];
        }
    }
    return null;
}

// devuelve todas las horas extra de un empleado
function obtenerPorEmpleado(empleadoId) {
    let resultado = [];
    for (let i = 0; i < estado.horasExtras.length; i++) {
        if (estado.horasExtras[i].empleadoId === empleadoId) {
            resultado.push(estado.horasExtras[i]);
        }
    }
    return resultado;
}

// devuelve las horas extra de un empleado dentro de un periodo "AAAA-MM"
// la fecha se guarda como "AAAA-MM-DD" por eso comparamos los primeros 7 caracteres
function obtenerPorEmpleadoPeriodo(empleadoId, periodo) {
    let resultado = [];
    for (let i = 0; i < estado.horasExtras.length; i++) {
        let horaExtra = estado.horasExtras[i];
        if (horaExtra.empleadoId === empleadoId && horaExtra.fecha.slice(0, 7) === periodo) {
            resultado.push(horaExtra);
        }
    }
    return resultado;
}

module.exports = {
    agregarHoraExtra: agregarHoraExtra,
    obtenerTodas: obtenerTodas,
    buscarPorId: buscarPorId,
    obtenerPorEmpleado: obtenerPorEmpleado,
    obtenerPorEmpleadoPeriodo: obtenerPorEmpleadoPeriodo
};
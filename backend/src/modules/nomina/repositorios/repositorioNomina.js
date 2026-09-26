const estado = require("./estado");

// agrega una nomina al final del array
function agregarNomina(nomina) {
    estado.nominas.push(nomina);
}

// devuelve el array con todas las nominas
function obtenerTodas() {
    return estado.nominas;
}

// devuelve la nomina que tenga ese id o null si no existe
function buscarPorId(id) {
    for (let i = 0; i < estado.nominas.length; i++) {
        if (estado.nominas[i].id === id) {
            return estado.nominas[i];
        }
    }
    return null;
}

// devuelve todas las nominas de un empleado
function obtenerPorEmpleado(empleadoId) {
    let resultado = [];
    for (let i = 0; i < estado.nominas.length; i++) {
        if (estado.nominas[i].empleadoId === empleadoId) {
            resultado.push(estado.nominas[i]);
        }
    }
    return resultado;
}

// revisa si ya existe una nomina para ese empleado en ese periodo
function existePeriodoEmpleado(empleadoId, periodo) {
    for (let i = 0; i < estado.nominas.length; i++) {
        let nomina = estado.nominas[i];
        if (nomina.empleadoId === empleadoId && nomina.periodo === periodo) {
            return true;
        }
    }
    return false;
}

module.exports = {
    agregarNomina: agregarNomina,
    obtenerTodas: obtenerTodas,
    buscarPorId: buscarPorId,
    obtenerPorEmpleado: obtenerPorEmpleado,
    existePeriodoEmpleado: existePeriodoEmpleado
};
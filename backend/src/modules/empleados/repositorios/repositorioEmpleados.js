const estado = require("./estado");

// Agrega un empleado al final del array
function agregarEmpleado(empleado) {
    estado.empleados.push(empleado);
}

// devuelve el array con todos los empleados
function obtenerTodos() {
    return estado.empleados;
}


function buscarEmpleadoPorId(id) {
    for (let i = 0; i < estado.empleados.length; i++) {
        if (estado.empleados[i].usuario.id === id) {
            return estado.empleados[i];
        }
    }
    return null; // si no lo encontramos devolvemos null
}

// "idAIgnorar" sirve para cuando estamos editando y no queremos chocar con el mismo empleado que estamos editando
function existeCedulaOCorreo(cedula, correo, idAIgnorar) {
    for (let i = 0; i < estado.empleados.length; i++) {
        let empleado = estado.empleados[i].usuario;
        if (empleado.id !== idAIgnorar) {
            if (empleado.cedula === cedula || empleado.correo === correo) {
                return true;
            }
        }
    }
    return false;
}

module.exports = {
    agregarEmpleado: agregarEmpleado,
    obtenerTodos: obtenerTodos,
    buscarEmpleadoPorId: buscarEmpleadoPorId,
    existeCedulaOCorreo: existeCedulaOCorreo
};
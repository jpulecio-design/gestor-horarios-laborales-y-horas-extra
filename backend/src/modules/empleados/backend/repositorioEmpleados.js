// ============================================
// repositorioEmpleados.js
// RESPONSABILIDAD: buscar y consultar dentro del array "empleados"
// ============================================

// Busca un empleado en el array "empleados" usando su id
// Recorremos con un for clásico y, apenas lo encontramos, usamos "return"
// para salir de la función inmediatamente con ese empleado
function buscarEmpleadoPorId(id) {
    for (let i = 0; i < empleados.length; i++) {
        if (empleados[i].usuario.id === id) {
            return empleados[i];
        }
    }
    return null; // si no lo encontramos, devolvemos null
}

// Revisa si YA existe un empleado con esa cedula o ese correo
// "idAIgnorar" sirve para cuando estamos EDITANDO: no queremos que el propio
// empleado que se está editando choque consigo mismo
function existeCedulaOCorreo(cedula, correo, idAIgnorar) {
    for (let i = 0; i < empleados.length; i++) {
        let empleado = empleados[i].usuario;
        if (empleado.id !== idAIgnorar) {
            if (empleado.cedula === cedula || empleado.correo === correo) {
                return true;
            }
        }
    }
    return false;
}
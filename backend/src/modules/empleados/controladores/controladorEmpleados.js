const empleado = require("../modelos/empleado");
const repositorio = require("../repositorios/repositorioEmpleados");
const detector = require("../servicios/detectorCambios");

// Validacion, que no queden campos obligatorios vacíos
function camposObligatoriosCompletos(datos) {
    if (datos.nombre === "" || datos.apellido === "" || datos.cedula === "" || datos.correo === "") {
        console.log("ERROR: completa al menos nombre, apellido, cédula y correo.");
        return false;
    }
    return true;
}

// registra un empleado nuevo Devuelve true si se guardo y false si no
function registrarEmpleado(datos) {
    if (!camposObligatoriosCompletos(datos)) {
        return false;
    }

    if (repositorio.existeCedulaOCorreo(datos.cedula, datos.correo, null)) {
        console.log("ERROR: ya existe un empleado con esa cédula o ese correo.");
        return false;
    }

    let nuevoEmpleado = empleado.crearEmpleado(datos);
    repositorio.agregarEmpleado(nuevoEmpleado);
    console.log("Empleado registrado con id " + nuevoEmpleado.usuario.id + ".");
    return true;
}

// aplica los cambios sobre el empleado con ese id
// devuelve true si se actualizo y false si no
function guardarEdicion(id, datosNuevos) {
    let empleadoViejo = repositorio.buscarEmpleadoPorId(id);
    if (empleadoViejo === null) {
        console.log("ERROR: no existe un empleado con id " + id + ".");
        return false;
    }

    if (!camposObligatoriosCompletos(datosNuevos)) {
        return false;
    }

    // validar que la cedula/correo nuevos no choquen con otro empleado distinto
    if (repositorio.existeCedulaOCorreo(datosNuevos.cedula, datosNuevos.correo, id)) {
        console.log("ERROR: ese correo o cédula ya lo tiene otro empleado.");
        return false;
    }

    // aqui se detectan los cambios antes de sobrescribir los datos viejos
    let cambios = detector.detectarCambios(empleadoViejo, datosNuevos);

    if (cambios.length === 0) {
        console.log("No hubo cambios.");
        return false;
    }

    // actualizamos los datos del empleado con los valores nuevos
    empleadoViejo.usuario.nombre = datosNuevos.nombre;
    empleadoViejo.usuario.apellido = datosNuevos.apellido;
    empleadoViejo.usuario.cedula = datosNuevos.cedula;
    empleadoViejo.usuario.correo = datosNuevos.correo;
    empleadoViejo.usuario.contrasena = datosNuevos.contrasena;
    empleadoViejo.usuario.telefono = datosNuevos.telefono;
    empleadoViejo.horaEntrada = datosNuevos.horaEntrada;
    empleadoViejo.horaSalida = datosNuevos.horaSalida;
    empleadoViejo.turno = datosNuevos.turno;
    empleadoViejo.acudiente.nombre = datosNuevos.acudienteNombre;
    empleadoViejo.acudiente.telefono = datosNuevos.acudienteTelefono;
    empleadoViejo.fechaIngreso = datosNuevos.fechaIngreso;

    console.log("Empleado actualizado. Cambios detectados:");
    for (let i = 0; i < cambios.length; i++) {
        console.log("  - " + cambios[i]);
    }

    return true;
}

module.exports = {
    registrarEmpleado: registrarEmpleado,
    guardarEdicion: guardarEdicion
};
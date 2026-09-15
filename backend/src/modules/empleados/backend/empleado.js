// ============================================
// empleado.js
// RESPONSABILIDAD: armar el objeto "empleado".
// ============================================

// Arma el objeto "empleado" completo. Fijate que "usuario" queda como una
// propiedad DENTRO de "empleado": empleado.usuario.nombre, empleado.usuario.cedula, etc.
// Recibe un solo objeto "datos" (asi no hay que pasar 12 parametros sueltos).
function crearEmpleado(datos) {
    let empleado = {
        usuario: crearMoldeUsuario(
            datos.nombre,
            datos.apellido,
            datos.cedula,
            datos.correo,
            datos.contrasena,
            datos.telefono,
            "Empleado" // el rol siempre es "Empleado" en este formulario
        ),
        horaEntrada: datos.horaEntrada,
        horaSalida: datos.horaSalida,
        turno: datos.turno,
        acudiente: {
            nombre: datos.acudienteNombre,
            telefono: datos.acudienteTelefono
        },
        fechaIngreso: datos.fechaIngreso
    };

    return empleado;
}
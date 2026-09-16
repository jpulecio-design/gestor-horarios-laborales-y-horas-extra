const usuario = require("./usuario");

// aqui queda armado el empleado y usuario como una propiedad
function crearEmpleado(datos) {
    let empleado = {
        usuario: usuario.crearMoldeUsuario(
            datos.nombre,
            datos.apellido,
            datos.cedula,
            datos.correo,
            datos.contrasena,
            datos.telefono,
            "Empleado" // el rol siempre es "Empleado" en este modulo
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

module.exports = {
    crearEmpleado: crearEmpleado
};
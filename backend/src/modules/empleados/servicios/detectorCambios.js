function detectarCambios(empleadoViejo, datosNuevos) {
    let cambios = [];

    // campo pal molde
    let usuarioNuevo = {
        nombre: datosNuevos.nombre,
        apellido: datosNuevos.apellido,
        cedula: datosNuevos.cedula,
        correo: datosNuevos.correo,
        contrasena: datosNuevos.contrasena,
        telefono: datosNuevos.telefono
    };

    for (let campo in usuarioNuevo) {
        let valorViejo = empleadoViejo.usuario[campo];
        let valorNuevo = usuarioNuevo[campo];

        if (campo === "contrasena") {
            // avisamos si cambio la cotra unicamente
            if (valorViejo !== valorNuevo) {
                cambios.push("Contraseña actualizada");
            }
            continue; // salta a la siguiente vuelta del for sin hacer lo de abajo
        }

        if (valorViejo !== valorNuevo) {
            cambios.push(campo + ": '" + valorViejo + "' -> '" + valorNuevo + "'");
        }
    }

    // Campos propios del empleado 
    if (empleadoViejo.horaEntrada !== datosNuevos.horaEntrada) {
        cambios.push("horaEntrada: '" + empleadoViejo.horaEntrada + "' -> '" + datosNuevos.horaEntrada + "'");
    }
    if (empleadoViejo.horaSalida !== datosNuevos.horaSalida) {
        cambios.push("horaSalida: '" + empleadoViejo.horaSalida + "' -> '" + datosNuevos.horaSalida + "'");
    }
    if (empleadoViejo.turno !== datosNuevos.turno) {
        cambios.push("turno: '" + empleadoViejo.turno + "' -> '" + datosNuevos.turno + "'");
    }
    if (empleadoViejo.fechaIngreso !== datosNuevos.fechaIngreso) {
        cambios.push("fechaIngreso: '" + empleadoViejo.fechaIngreso + "' -> '" + datosNuevos.fechaIngreso + "'");
    }
    if (empleadoViejo.acudiente.nombre !== datosNuevos.acudienteNombre) {
        cambios.push("acudiente.nombre: '" + empleadoViejo.acudiente.nombre + "' -> '" + datosNuevos.acudienteNombre + "'");
    }
    if (empleadoViejo.acudiente.telefono !== datosNuevos.acudienteTelefono) {
        cambios.push("acudiente.telefono: '" + empleadoViejo.acudiente.telefono + "' -> '" + datosNuevos.acudienteTelefono + "'");
    }

    return cambios;
}

module.exports = {
    detectarCambios: detectarCambios
};
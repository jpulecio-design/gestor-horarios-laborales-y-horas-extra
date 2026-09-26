function detectarCambios(empleadoViejo, datosNuevos) {
    let cambios = [];

    // campos del molde viven en empleado viejo
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
            if (valorViejo !== valorNuevo) {
                cambios.push("Contraseña actualizada");
            }
            continue; // salta a la siguiente vuelta del for
        }

        if (valorViejo !== valorNuevo) {
            cambios.push(campo + ": '" + valorViejo + "' -> '" + valorNuevo + "'");
        }
    }

    // Campos propios del empleado viven directo en empleadoViejo
    let empleadoNuevo = {
        fechaIngreso: datosNuevos.fechaIngreso,
        cargo: datosNuevos.cargo,
        salarioBase: datosNuevos.salarioBase,
        telegramChatId: datosNuevos.telegramChatId
    };

    for (let campo in empleadoNuevo) {
        if (empleadoViejo[campo] !== empleadoNuevo[campo]) {
            cambios.push(campo + ": '" + empleadoViejo[campo] + "' -> '" + empleadoNuevo[campo] + "'");
        }
    }

    // Contacto de emergencia vive en empleadoViejo.contactoEmergencia
    let contactoNuevo = {
        nombre: datosNuevos.contactoNombre,
        telefono: datosNuevos.contactoTelefono,
        parentesco: datosNuevos.contactoParentesco
    };

    for (let campo in contactoNuevo) {
        let valorViejo = empleadoViejo.contactoEmergencia[campo];
        if (valorViejo !== contactoNuevo[campo]) {
            cambios.push("contactoEmergencia." + campo + ": '" + valorViejo + "' -> '" + contactoNuevo[campo] + "'");
        }
    }

    return cambios;
}

module.exports = {
    detectarCambios: detectarCambios
};
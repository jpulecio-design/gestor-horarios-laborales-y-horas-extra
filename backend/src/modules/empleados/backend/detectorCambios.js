// ============================================
// detectorCambios.js
// RESPONSABILIDAD: comparar un empleado viejo con los datos nuevos
// ============================================

// --- MINI CLASE: el bucle for...in ---
// Hasta ahora recorriste ARRAYS con for/forEach. Un OBJETO no tiene índices
// numéricos (0,1,2...), así que para recorrer sus propiedades se usa otro
// tipo de bucle: for...in. Ejemplo minimo:
//
//   let persona = { nombre: "Ana", edad: 20 };
//   for (let clave in persona) {
//     console.log(clave, "->", persona[clave]);
//   }
//   // Imprime:
//   // nombre -> Ana
//   // edad -> 20
//
// "clave" va tomando el NOMBRE de cada propiedad ("nombre", "edad"...).
// persona[clave] es lo mismo que escribir persona.nombre, pero usando una
// variable en vez del nombre fijo: los corchetes permiten usar una variable
// como si fuera el nombre de la propiedad

// Compara el empleado ANTES de editar contra los datos NUEVOS del formulario
// y devuelve un array de textos describiendo cada cambio encontrado
function detectarCambios(empleadoViejo, datosNuevos) {
    let cambios = [];

    // --- Campos que viven dentro de "usuario" (el molde) ---
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
            // Por seguridad, si cambió la contraseña avisamos SIN mostrar el valor real
            if (valorViejo !== valorNuevo) {
                cambios.push("Contraseña actualizada");
            }
            continue; // 'continue' salta a la siguiente vuelta del for sin hacer lo de abajo
        }

        if (valorViejo !== valorNuevo) {
            cambios.push(campo + ": '" + valorViejo + "' -> '" + valorNuevo + "'");
        }
    }

    // --- Campos propios del empleado (no estan dentro de "usuario") ---
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
// ============================================
// controladorEmpleados.js
// RESPONSABILIDAD: coordinar qué pasa al guardar (crear o editar)
// ============================================

// Se ejecuta cuando el administrador da clic en "Guardar" (ver main.js)
function manejarClicGuardar() {
    let datos = leerDatosDelFormulario();

    // Validación basica: que no queden campos obligatorios vacios
    if (datos.nombre === "" || datos.apellido === "" || datos.cedula === "" || datos.correo === "") {
        alert("Por favor completa al menos nombre, apellido, cédula y correo.");
        return; // corta la funcion aqui mismo, no sigue ejecutando el resto
    }

    if (idEnEdicion === null) {
        // ----- Estamos CREANDO un empleado nuevo -----
        if (existeCedulaOCorreo(datos.cedula, datos.correo, null)) {
            alert("Ya existe un empleado con esa cédula o ese correo.");
            return;
        }
        let nuevoEmpleado = crearEmpleado(datos);
        empleados.push(nuevoEmpleado); // lo agregamos al final del array
    } else {
        // ----- Estamos EDITANDO (el detalle está en guardarEdicion, abajo) -----
        guardarEdicion(datos);
    }

    renderizarTablaEmpleados(); // tabla.js: repintamos la tabla
    limpiarFormulario();
}

// Aplica los cambios: guarda los datos nuevos sobre el empleado que se
// estaba editando, y dispara el mensaje de Telegram (telegram.js) si hubo cambios.
function guardarEdicion(datosNuevos) {
    let empleadoViejo = buscarEmpleadoPorId(idEnEdicion);
    if (empleadoViejo === null) {
        return;
    }

    // Validar que la cédula/correo nuevos no choquen con OTRO empleado distinto
    if (existeCedulaOCorreo(datosNuevos.cedula, datosNuevos.correo, idEnEdicion)) {
        alert("Ese correo o cédula ya lo tiene otro empleado.");
        return;
    }

    // IMPORTANTE: detectamos los cambios ANTES de sobrescribir los datos viejos
    let cambios = detectarCambios(empleadoViejo, datosNuevos);

    // Ahora si, actualizamos los datos del empleado con los valores nuevos.
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

    if (cambios.length > 0) {
        let mensaje = armarMensajeTelegram(empleadoViejo, cambios); // telegram.js
        enviarMensajeTelegram(mensaje);                              // telegram.js
    }
}
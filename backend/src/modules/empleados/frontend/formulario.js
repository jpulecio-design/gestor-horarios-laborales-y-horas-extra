// ============================================
// formulario.js
// RESPONSABILIDAD: leer, llenar y limpiar el formulario (DOM)
// ============================================

// Lee todos los inputs del formulario y los junta en un objeto simple
function leerDatosDelFormulario() {
    return {
        nombre: document.getElementById("inputNombre").value,
        apellido: document.getElementById("inputApellido").value,
        cedula: document.getElementById("inputCedula").value,
        correo: document.getElementById("inputCorreo").value,
        contrasena: document.getElementById("inputContrasena").value,
        telefono: document.getElementById("inputTelefono").value,
        horaEntrada: document.getElementById("inputHoraEntrada").value,
        horaSalida: document.getElementById("inputHoraSalida").value,
        turno: document.getElementById("inputTurno").value,
        acudienteNombre: document.getElementById("inputAcudienteNombre").value,
        acudienteTelefono: document.getElementById("inputAcudienteTelefono").value,
        fechaIngreso: document.getElementById("inputFechaIngreso").value
    };
}

// Vacia el formulario y vuelve al modo "crear"
function limpiarFormulario() {
    document.getElementById("formEmpleado").reset(); // reset() borra todos los campos del form
    idEnEdicion = null;
    document.getElementById("btnGuardar").textContent = "Guardar";
}

// Cuando el administrador da clic en "Editar", cargamos los datos de ese
// empleado en el formulario para que pueda modificarlos
function cargarEmpleadoParaEditar(id) {
    let emp = buscarEmpleadoPorId(id);
    if (emp === null) {
        return;
    }

    document.getElementById("inputNombre").value = emp.usuario.nombre;
    document.getElementById("inputApellido").value = emp.usuario.apellido;
    document.getElementById("inputCedula").value = emp.usuario.cedula;
    document.getElementById("inputCorreo").value = emp.usuario.correo;
    document.getElementById("inputContrasena").value = emp.usuario.contrasena;
    document.getElementById("inputTelefono").value = emp.usuario.telefono;
    document.getElementById("inputHoraEntrada").value = emp.horaEntrada;
    document.getElementById("inputHoraSalida").value = emp.horaSalida;
    document.getElementById("inputTurno").value = emp.turno;
    document.getElementById("inputAcudienteNombre").value = emp.acudiente.nombre;
    document.getElementById("inputAcudienteTelefono").value = emp.acudiente.telefono;
    document.getElementById("inputFechaIngreso").value = emp.fechaIngreso;

    idEnEdicion = id; // desde ahora, el clic en "Guardar" va a EDITAR, no a crear
    document.getElementById("btnGuardar").textContent = "Guardar cambios";
}
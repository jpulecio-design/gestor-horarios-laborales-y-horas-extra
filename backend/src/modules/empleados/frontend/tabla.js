// ============================================
// tabla.js
// RESPONSABILIDAD: pintar la lista de empleados en la tabla (DOM)
// ============================================

function renderizarTablaEmpleados() {
    let cuerpoTabla = document.getElementById("cuerpoTablaEmpleados");

    cuerpoTabla.innerHTML = ""; // borramos lo que habia antes, para no duplicar filas

    for (let i = 0; i < empleados.length; i++) {
        let emp = empleados[i];

        // Armamos el HTML de la fila con concatenación de strings 
        // El boton "Editar" llama a cargarEmpleadoParaEditar(id) directamente
        // desde el atributo onclick, pasándole el id de ESE empleado
        let fila =
            "<tr>" +
            "<td>" + emp.usuario.id + "</td>" +
            "<td>" + emp.usuario.nombre + " " + emp.usuario.apellido + "</td>" +
            "<td>" + emp.usuario.cedula + "</td>" +
            "<td>" + emp.usuario.correo + "</td>" +
            "<td>" + emp.usuario.telefono + "</td>" +
            "<td>" + emp.turno + "</td>" +
            "<td>" + emp.usuario.estado + "</td>" +
            "<td><button onclick='cargarEmpleadoParaEditar(" + emp.usuario.id + ")'>Editar</button></td>" +
            "</tr>";

        cuerpoTabla.innerHTML += fila;
        // esto reconstruye la tabla completa en cada llamada
    }
}
function armarMensajeCambios(empleado, cambios) {
    let mensaje =
        "Se actualizaron los datos de " + empleado.usuario.nombre + " " +
        empleado.usuario.apellido + " (id " + empleado.usuario.id + "):\n";

    for (let i = 0; i < cambios.length; i++) {
        mensaje = mensaje + "- " + cambios[i] + "\n"; // "\n" = salto de línea
    }

    return mensaje;
}

module.exports = {
    armarMensajeCambios: armarMensajeCambios
};
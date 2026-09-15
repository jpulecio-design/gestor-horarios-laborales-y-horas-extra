// ============================================
// usuario.js
// RESPONSABILIDAD: definir el "molde" del usuario.
// ============================================
// ¿Por qué una función y no una clase?
// Porque una función que arma y devuelve un objeto (llamada "función fábrica")
// logra lo mismo que una clase para este caso: crear varios objetos con la
// misma forma (mismos campos). La diferencia es que NO usa "class", "this"
// ni "new", que son conceptos más avanzados que todavía no viste. Con lo que
// ya sabes (funciones, parámetros, return, objetos) alcanza perfectamente.

function crearMoldeUsuario(nombre, apellido, cedula, correo, contrasena, telefono, rol) {
    // "molde" = objeto con la forma básica que comparten TODOS los usuarios
    // del sistema (administrador, contador y empleados).
    let usuario = {
        id: contadorId,
        nombre: nombre,
        apellido: apellido,
        cedula: cedula,
        correo: correo,
        contrasena: contrasena,
        telefono: telefono,
        rol: rol,
        estado: "Activo",                           // todo usuario nuevo nace "Activo"
        fechaCreacion: new Date().toLocaleString()   // fecha y hora exactas de creacion
    };

    contadorId = contadorId + 1; // iteramos el contador para que el proximo tenga otro id

    return usuario;
}
const estado = require("../repositorios/estado");

function crearMoldeUsuario(nombre, apellido, cedula, correo, contrasena, telefono, rol) {
    // esta parte es el molde que comparten todos los usuarios
    let usuario = {
        id: estado.contadorId,
        nombre: nombre,
        apellido: apellido,
        cedula: cedula,
        correo: correo,
        contrasena: contrasena,
        telefono: telefono,
        rol: rol,
        estado: "Activo",                           // todo usuario nuevo se instancia o se crea "Activo"
        fechaCreacion: new Date().toLocaleString()   // fecha y hora exactas de creacion
    };

    estado.contadorId = estado.contadorId + 1; // subimos el contador para que el proximo tenga otro id

    return usuario;
}

module.exports = {
    crearMoldeUsuario: crearMoldeUsuario
};
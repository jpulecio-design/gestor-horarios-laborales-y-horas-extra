function crearMoldeUsuario(id, nombre, apellido, cedula, correo, contrasena, telefono, rol, estado, fechaCreacion) {

    let usuario = {
        id: id,
        nombre: nombre,
        apellido: apellido,
        cedula: cedula,
        correo: correo,
        contrasena: contrasena,
        telefono: telefono,
        rol: rol,
        estado: estado,
        fechaCreacion: fechaCreacion
    };

    return usuario;
}

module.exports = {
    crearMoldeUsuario: crearMoldeUsuario
};
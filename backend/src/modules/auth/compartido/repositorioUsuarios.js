const database = require("../../../config/database");

function buscarPorUsername(username) {

    const sql =
        "SELECT id_empleado, correo, contrasena, rol, estado " +
        "FROM EMPLEADO " +
        "WHERE correo = :username";

    return database.ejecutar(sql, {
        username: username
    })
        .then(function (resultado) {

            if (resultado.rows.length === 0) {
                return null;
            }

            const fila = resultado.rows[0];

            return {
                id: fila.ID_EMPLEADO,
                username: fila.CORREO,
                password: fila.CONTRASENA,
                rol: fila.ROL,
                estado: fila.ESTADO
            };
        });
}

function buscarPorId(id) {
    const sql =
        "SELECT id_empleado, correo, contrasena, rol, estado " +
        "FROM EMPLEADO " +
        "WHERE id_empleado = :id";

    return database.ejecutar(sql, {
        id: id
    })
        .then(function (resultado) {
            if (resultado.rows.length === 0) {
                return null;
            }

            const fila = resultado.rows[0];

            return {
                id: fila.ID_EMPLEADO,
                username: fila.CORREO,
                password: fila.CONTRASENA,
                rol: fila.ROL,
                estado: fila.ESTADO
            };
        });
}

function actualizarContrasena(id, nuevaContrasenaHash) {
    const sql = "UPDATE EMPLEADO SET contrasena = :nuevaContrasena WHERE id_empleado = :id";
    return database.ejecutar(sql, {
        nuevaContrasena: nuevaContrasenaHash,
        id: id
    })
        .then(function () {
            return buscarPorId(id);
        });
}

module.exports = {
    buscarPorUsername: buscarPorUsername,
    buscarPorId: buscarPorId,
    actualizarContrasena: actualizarContrasena
};
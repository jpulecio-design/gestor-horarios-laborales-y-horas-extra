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

// Perfil del usuario autenticado por su id (cualquier rol), sin la contrasena.
function buscarPorId(id) {

    const sql =
        "SELECT id_empleado, nombre, apellido, correo, telefono, rol, estado, cargo, " +
        "TO_CHAR(fecha_ingreso, 'YYYY-MM-DD') AS fecha_ingreso " +
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
                nombre: fila.NOMBRE,
                apellido: fila.APELLIDO,
                correo: fila.CORREO,
                telefono: fila.TELEFONO,
                rol: fila.ROL,
                estado: fila.ESTADO,
                cargo: fila.CARGO,
                fechaIngreso: fila.FECHA_INGRESO
            };
        });
}

module.exports = {
    buscarPorUsername: buscarPorUsername,
    buscarPorId: buscarPorId
};
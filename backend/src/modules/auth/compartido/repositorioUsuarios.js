const { getConnection } = require("../../../config/database");

async function buscarPorUsername(username) {

    let connection;

    try {

        connection = await getConnection();

        const resultado = await connection.execute(
            `
            SELECT
                id_empleado,
                correo,
                contrasena,
                rol,
                estado
            FROM EMPLEADO
            WHERE LOWER(correo) = LOWER(:username)
            `,
            {
                username: username
            }
        );

        if (resultado.rows.length === 0) {
            return null;
        }

        const usuario = resultado.rows[0];

        return {
            id: usuario.ID_EMPLEADO,
            username: usuario.CORREO,
            password: usuario.CONTRASENA,
            rol: usuario.ROL,
            estado: usuario.ESTADO
        };

    } finally {

        if (connection) {
            await connection.close();
        }

    }
}

module.exports = {
    buscarPorUsername
};
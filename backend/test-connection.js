const { getConnection } = require("./src/config/database");

async function probarConexion() {
    let connection;

    try {
        connection = await getConnection();

        const resultado = await connection.execute(`
            SELECT 
                USER AS USUARIO,
                SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA') AS ESQUEMA
            FROM DUAL
        `);

        console.log(resultado.rows);

    } catch (error) {
        console.error(error);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

probarConexion();
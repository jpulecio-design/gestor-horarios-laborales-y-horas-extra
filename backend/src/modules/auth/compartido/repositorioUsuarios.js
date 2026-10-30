const database = require("../../../config/database");

function buscarPorUsername(username) {

    const sql =
        "SELECT id_empleado, correo, contrasena, rol, estado " +
        "FROM EMPLEADO " +
        "WHERE LOWER(TRIM(correo)) = LOWER(TRIM(:username))";

    return database.ejecutar(sql, {
        username: String(username).trim()
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

function guardarCodigoRecuperacion(id, codigoHash, expiraEn) {
    const sql =
        "MERGE INTO RECUPERACION_CONTRASENA destino " +
        "USING (SELECT :id_empleado AS id_empleado FROM dual) origen " +
        "ON (destino.id_empleado = origen.id_empleado) " +
        "WHEN MATCHED THEN UPDATE SET " +
        "destino.codigo_hash = :codigo_hash, destino.expira_en = :expira_en, destino.intentos = 0 " +
        "WHEN NOT MATCHED THEN INSERT (id_empleado, codigo_hash, expira_en, intentos) " +
        "VALUES (:id_empleado, :codigo_hash, :expira_en, 0)";

    return database.ejecutar(sql, {
        id_empleado: id,
        codigo_hash: codigoHash,
        expira_en: expiraEn
    });
}

async function cambiarContrasenaConCodigo(id, codigoHash, nuevaContrasenaHash) {
    const conexion = await database.getConnection();
    try {
        const resultado = await conexion.execute(
            "SELECT codigo_hash FROM RECUPERACION_CONTRASENA " +
            "WHERE id_empleado = :id AND expira_en > SYSTIMESTAMP AND intentos < 5 " +
            "FOR UPDATE",
            { id: id },
            { outFormat: database.oracledb.OUT_FORMAT_OBJECT }
        );

        if (resultado.rows.length === 0) {
            await conexion.rollback();
            return false;
        }

        if (resultado.rows[0].CODIGO_HASH !== codigoHash) {
            await conexion.execute(
                "UPDATE RECUPERACION_CONTRASENA SET intentos = intentos + 1 WHERE id_empleado = :id",
                { id: id }
            );
            await conexion.commit();
            return false;
        }

        const actualizacion = await conexion.execute(
            "UPDATE EMPLEADO SET contrasena = :contrasena " +
            "WHERE id_empleado = :id AND estado = 'Activo'",
            { contrasena: nuevaContrasenaHash, id: id }
        );

        if (actualizacion.rowsAffected === 0) {
            await conexion.rollback();
            return false;
        }

        await conexion.execute(
            "DELETE FROM RECUPERACION_CONTRASENA WHERE id_empleado = :id",
            { id: id }
        );
        await conexion.commit();
        return true;
    } catch (error) {
        await conexion.rollback();
        throw error;
    } finally {
        await conexion.close();
    }
}

module.exports = {
    buscarPorUsername: buscarPorUsername,
    guardarCodigoRecuperacion: guardarCodigoRecuperacion,
    cambiarContrasenaConCodigo: cambiarContrasenaConCodigo
};
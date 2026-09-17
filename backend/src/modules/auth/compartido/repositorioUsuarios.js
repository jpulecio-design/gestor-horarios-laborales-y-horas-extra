const { getConnection } = require('../../../config/database');

async function buscarPorUsername(username) {
  const connection = await getConnection();
  try {
    const result = await connection.execute(
      `SELECT id_empleado, correo, contrasena, rol
       FROM EMPLEADO
       WHERE correo = :username`,
      { username }
    );
    return result.rows[0] || null;
  } finally {
    await connection.close();
  }
}

module.exports = { buscarPorUsername };
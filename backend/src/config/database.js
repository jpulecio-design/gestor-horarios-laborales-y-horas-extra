const oracledb = require('oracledb');
require('dotenv').config();
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
async function getConnection() {
  try {
    const connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING 
    });
    console.log('Conexión a Oracle exitosa');
    return connection;
  } catch (err) {
    console.error('Error de conexión a Oracle:', err);
    throw err;
  }
}

module.exports = { getConnection };
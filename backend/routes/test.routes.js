// backend/routes/test.routes.js
//
// Ruta de prueba para confirmar, vía HTTP, que la conexión a Oracle
// funciona. Se prueba desde Thunder Client haciendo GET a /api/test-db

const express = require('express');
const router = express.Router();
const { getConnection } = require('../src/config/database');

router.get('/test-db', async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute('SELECT sysdate AS FECHA FROM dual');
    res.json(result.rows);
  } catch (err) {
    console.error('Error en /test-db:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

module.exports = router;
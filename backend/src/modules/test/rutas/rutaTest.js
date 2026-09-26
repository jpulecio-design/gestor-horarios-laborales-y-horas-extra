// Ruta de prueba para confirmar, vía HTTP, que la conexión a Oracle
// funciona. Se prueba haciendo GET a /api/test/test-db

const express = require("express");

const { getConnection } = require("../../../config/database");

const router = express.Router();

// GET /api/test/health -> siempre responde, no toca la base de datos
router.get("/health", (req, res) => {
    res.json({ ok: true, mensaje: "API funcionando" });
});

// GET /api/test/test-db -> confirma conexion a Oracle
router.get("/test-db", async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute("SELECT sysdate AS FECHA FROM dual");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

module.exports = router;
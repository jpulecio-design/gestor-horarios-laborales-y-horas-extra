// ============================================================
// Middleware de autenticacion.
//
// Lee la cabecera "Authorization: Bearer <token>", verifica el JWT
// y deja los datos del usuario en req.usuario = { id, username, rol }.
// Si falta o es invalido responde 401.
// ============================================================

const seguridad = require("../src/modules/auth/compartido/seguridad");

function autenticar(req, res, next) {
    const cabecera = req.headers.authorization || "";
    const partes = cabecera.split(" ");

    if (partes.length !== 2 || partes[0] !== "Bearer" || !partes[1]) {
        res.status(401).json({ error: "No autenticado. Falta el token de sesión." });
        return;
    }

    const datos = seguridad.verificarToken(partes[1]);

    if (!datos) {
        res.status(401).json({ error: "Sesión inválida o expirada. Inicia sesión de nuevo." });
        return;
    }

    req.usuario = {
        id: datos.id,
        username: datos.username,
        rol: datos.rol
    };

    next();
}

module.exports = autenticar;

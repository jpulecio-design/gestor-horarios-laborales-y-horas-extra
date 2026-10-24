// ============================================================
// Middlewares de autorizacion por rol.
//
//   autorizar("Administrador", "Contadora")
//       -> solo esos roles pueden pasar.
//
//   autorizarPropio("Administrador", "Contadora")
//       -> pasan esos roles o el propio empleado cuando el :id de
//          la ruta coincide con el id de su sesion.
//
// Deben usarse siempre DESPUES de autenticar (req.usuario ya existe).
// ============================================================

function autorizar(...roles) {
    return function (req, res, next) {
        if (!req.usuario) {
            res.status(401).json({ error: "No autenticado." });
            return;
        }
        if (roles.length === 0 || roles.indexOf(req.usuario.rol) !== -1) {
            next();
            return;
        }
        res.status(403).json({ error: "No tienes permiso para esta acción." });
    };
}

function autorizarPropio(...roles) {
    return function (req, res, next) {
        if (!req.usuario) {
            res.status(401).json({ error: "No autenticado." });
            return;
        }
        if (roles.indexOf(req.usuario.rol) !== -1) {
            next();
            return;
        }
        if (String(req.usuario.id) === String(req.params.id)) {
            next();
            return;
        }
        res.status(403).json({ error: "Solo puedes consultar tu propia información." });
    };
}

module.exports = {
    autorizar: autorizar,
    autorizarPropio: autorizarPropio
};

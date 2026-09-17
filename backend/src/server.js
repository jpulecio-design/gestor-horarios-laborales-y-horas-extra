const app = require("./app");

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
    console.log("API escuchando en el puerto " + PORT);
    console.log("  /api/auth        -> POST /login");
    console.log("  /api/test        -> GET /health, GET /test-db");
    console.log("  /api/empleados   -> GET /, POST /, PUT /:id");
    console.log("  /api/horas-extra -> GET /, POST /");
    console.log("  /api/nomina      -> GET /, POST /");
});
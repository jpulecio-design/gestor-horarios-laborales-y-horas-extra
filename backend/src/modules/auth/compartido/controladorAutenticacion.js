const servicioAutenticacion = require("./servicioAutenticacion");

async function iniciarSesion(req, res) {

    const { username, password } = req.body;

    const resultado = await servicioAutenticacion.iniciarSesion(
        username,
        password
    );

    res.json(resultado);
}

module.exports = {
    iniciarSesion
};
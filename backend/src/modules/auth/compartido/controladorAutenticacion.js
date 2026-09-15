const servicioAutenticacion = require(
    "./servicios/servicioAutenticacion"
);

function iniciarSesion(req, res) {
    const { username, password } = req.body;

    const resultado = servicioAutenticacion.iniciarSesion(
        username,
        password
    );

    res.json(resultado);
}

module.exports = {
    iniciarSesion
};
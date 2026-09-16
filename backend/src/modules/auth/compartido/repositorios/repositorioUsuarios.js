const usuarios = require("../data/usuarios.mock.js");

function buscarPorUsername(username) {
    return usuarios.find(
        usuario => usuario.username.toLowerCase() === username.toLowerCase()
    );
}

module.exports = {
    buscarPorUsername
};
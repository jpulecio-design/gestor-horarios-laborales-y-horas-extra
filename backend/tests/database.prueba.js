const database = require("../src/config/database");

console.log("Conectando a Oracle...");

// USER es una palabra de Oracle que devuelve con que usuario estas conectado
database.ejecutar("SELECT USER AS usuario FROM DUAL", {})
    .then(function (resultado) {
        console.log("Conexión exitosa. Usuario: " + resultado.rows[0].USUARIO);
        return database.ejecutar("SELECT COUNT(*) AS total FROM EMPLEADO", {});
    })
    .then(function (resultado) {
        console.log("La tabla EMPLEADO existe y tiene " + resultado.rows[0].TOTAL + " registros.");
    })
    .catch(function (error) {
        console.log("FALLÓ: " + error.message);
    });
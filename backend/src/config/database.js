
require("dotenv").config({ path: require("path").join(__dirname, "../../.env"), quiet: true });

const oracledb = require("oracledb");

const configuracion = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING
};

function ejecutar(sql, parametros) {
    if (!configuracion.user || !configuracion.password || !configuracion.connectString) {
        return Promise.reject(new Error("Faltan DB_USER, DB_PASSWORD o DB_CONNECT_STRING en el archivo .env"));
    }

    let conexion = null;

    return oracledb.getConnection(configuracion)
        .then(function (nuevaConexion) {
            conexion = nuevaConexion;
            return conexion.execute(sql, parametros, {
                autoCommit: true,
                outFormat: oracledb.OUT_FORMAT_OBJECT
            });
        })
        .finally(function () {
            if (conexion !== null) {
                return conexion.close();
            }
        });
}

module.exports = {
    ejecutar: ejecutar,
    oracledb: oracledb
};
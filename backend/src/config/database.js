require("dotenv").config({ quiet: true });

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

    return oracledb.getConnection(configuracion)          // a) abrir la conexión
        .then(function (nuevaConexion) {
            conexion = nuevaConexion;
            return conexion.execute(sql, parametros, {     // b) ejecutar la consulta
                autoCommit: true,                          //    guardar los cambios de inmediato
                outFormat: oracledb.OUT_FORMAT_OBJECT      //    filas como objetos (no como arrays)
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
    oracledb: oracledb // se exporta para usar sus constantes (ej: oracledb.BIND_OUT)
};
require("dotenv").config({ quiet: true });

const oracledb = require("oracledb");

// Se aceptan los dos nombres de variables para no romper archivos .env
// existentes (DB_*) ni el ejemplo del repositorio (ORACLE_*).
const configuracion = {
    user: process.env.DB_USER || process.env.ORACLE_USER,
    password: process.env.DB_PASSWORD || process.env.ORACLE_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING || process.env.ORACLE_CONNECT_STRING
};

// Pool de conexiones: se crea una sola vez y se reutiliza. Evita abrir y
// cerrar una conexión por cada consulta.
let pool = null;

function faltaConfiguracion() {
    return !configuracion.user || !configuracion.password || !configuracion.connectString;
}

// Crea el pool la primera vez que se necesita.
function obtenerPool() {
    if (faltaConfiguracion()) {
        return Promise.reject(new Error(
            "Faltan DB_USER, DB_PASSWORD o DB_CONNECT_STRING en el archivo .env"
        ));
    }

    if (pool !== null) {
        return Promise.resolve(pool);
    }

    return oracledb.createPool({
        user: configuracion.user,
        password: configuracion.password,
        connectString: configuracion.connectString,
        poolMin: 0,
        poolMax: 10,
        poolIncrement: 1
    })
        .then(function (nuevoPool) {
            pool = nuevoPool;
            return pool;
        });
}

// Devuelve una conexión lista para usar. Quien la pida debe cerrarla.
function getConnection() {
    return obtenerPool().then(function (p) {
        return p.getConnection();
    });
}

// Ejecuta una sentencia con parámetros (bind variables, a prueba de
// inyección SQL) y devuelve el resultado de oracledb.
function ejecutar(sql, parametros) {
    if (faltaConfiguracion()) {
        return Promise.reject(new Error(
            "Faltan DB_USER, DB_PASSWORD o DB_CONNECT_STRING en el archivo .env"
        ));
    }

    let conexion = null;

    return getConnection()
        .then(function (nuevaConexion) {                   // a) tomar una conexión del pool
            conexion = nuevaConexion;
            return conexion.execute(sql, parametros || {}, { // b) ejecutar la consulta
                autoCommit: true,                            //    guardar los cambios de inmediato
                outFormat: oracledb.OUT_FORMAT_OBJECT        //    filas como objetos (no como arrays)
            });
        })
        .finally(function () {                               // c) devolver siempre la conexión al pool
            if (conexion !== null) {
                return conexion.close();
            }
        });
}

// Cierra el pool (se usa al apagar el proceso).
function cerrar() {
    if (pool === null) {
        return Promise.resolve();
    }

    let actual = pool;
    pool = null;
    return actual.close(0);
}

module.exports = {
    ejecutar: ejecutar,
    getConnection: getConnection,
    cerrar: cerrar,
    oracledb: oracledb // se exporta para usar sus constantes (ej: oracledb.BIND_OUT)
};

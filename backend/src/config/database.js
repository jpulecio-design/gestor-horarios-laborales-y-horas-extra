const dotenv = require("dotenv");
const oracledb = require("oracledb");

dotenv.config();

// saber si las variables de entorno de Oracle estan completas
function configuracionDisponible() {
    return Boolean(
        process.env.ORACLE_USER &&
        process.env.ORACLE_PASSWORD &&
        process.env.ORACLE_CONNECT_STRING
    );
}

// abre una conexion a Oracle
// si no hay configuracion (.env) lanza un error claro en vez de reventar la app
async function getConnection() {
    if (!configuracionDisponible()) {
        throw new Error(
            "Faltan variables de entorno para Oracle " +
            "(ORACLE_USER, ORACLE_PASSWORD, ORACLE_CONNECT_STRING). " +
            "Copia .env.example a .env y completalas."
        );
    }

    return oracledb.getConnection({
        user: process.env.ORACLE_USER,
        password: process.env.ORACLE_PASSWORD,
        connectString: process.env.ORACLE_CONNECT_STRING
    });
}

module.exports = {
    getConnection,
    configuracionDisponible
};
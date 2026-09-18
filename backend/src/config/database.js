// ============================================
// database.js   (src/config)
// RESPONSABILIDAD: conectarse a Oracle y ejecutar consultas SQL.
// ============================================
// Es el ÚNICO archivo del proyecto que sabe CÓMO conectarse a la base de datos.
// Los repositorios solo le dicen QUÉ consulta ejecutar.

// 1. Cargar las variables del archivo .env (DB_USER, DB_PASSWORD, DB_CONNECT_STRING).
require("dotenv").config({ quiet: true });

// 2. "oracledb" es la librería oficial de Oracle para Node.
//    Desde la versión 6 funciona en "modo Thin": NO hay que instalar
//    nada extra de Oracle en el computador, solo la librería.
const oracledb = require("oracledb");

// 3. Datos de conexión, leídos del .env.
const configuracion = {
    user: process.env.DB_USER,                    // ej: C##PAPITORICO
    password: process.env.DB_PASSWORD,            // ej: 1234
    connectString: process.env.DB_CONNECT_STRING  // ej: localhost:1521/xe  (servidor:puerto/servicio)
};

// Ejecuta UNA consulta SQL y devuelve una PROMESA con el resultado.
//
// - sql:        el texto de la consulta. Los valores van como  :nombre
// - parametros: objeto con el valor de cada  :nombre
//
// Ejemplo:
//   ejecutar("SELECT * FROM EMPLEADO WHERE cedula = :cedula", { cedula: "1001" })
//
// --- MINI CLASE: ¿por qué  :cedula  y no pegar el valor en el texto? ---
// Si armáramos  "... WHERE cedula = '" + cedula + "'"  alguien podría escribir
// en la cédula un pedazo de SQL y dañar la base de datos (eso se llama
// "inyección SQL"). Con  :cedula  Oracle trata el valor SIEMPRE como un dato,
// nunca como código. Además, así no hay que pelear con las comillas.
//
// El resultado trae:
//   resultado.rows          -> filas de un SELECT, como objetos { NOMBRE: "Ana", ... }
//   resultado.rowsAffected  -> cuántas filas cambió un INSERT/UPDATE/DELETE
//   resultado.outBinds      -> valores que Oracle devuelve (ej: el id generado)
function ejecutar(sql, parametros) {
    // Si falta algún dato del .env, avisamos con un mensaje claro.
    if (!configuracion.user || !configuracion.password || !configuracion.connectString) {
        return Promise.reject(new Error("Faltan DB_USER, DB_PASSWORD o DB_CONNECT_STRING en el archivo .env"));
        // Promise.reject(...) crea una promesa que YA falló: el .catch de quien llamó la recibe.
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
        .finally(function () {                             // c) cerrar SIEMPRE, salga bien o mal
            // .finally() corre tanto si hubo éxito como si hubo error,
            // y deja pasar el resultado (o el error) tal cual.
            if (conexion !== null) {
                return conexion.close();
            }
        });
}

module.exports = {
    ejecutar: ejecutar,
    oracledb: oracledb // se exporta para usar sus constantes (ej: oracledb.BIND_OUT)
};
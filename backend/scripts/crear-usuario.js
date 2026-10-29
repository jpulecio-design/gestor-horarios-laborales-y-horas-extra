// ============================================================
// Crea el usuario (esquema) de la aplicacion dentro del PDB FREEPDB1.
// Se conecta como SYSTEM y crea el usuario indicado en DB_USER.
//
//   node scripts/crear-usuario.js
//
// Requiere en el .env:
//   ORACLE_SYS_USER          (por defecto: system)
//   ORACLE_SYS_PASSWORD      (la clave que pediste al instalar Oracle)
//   ORACLE_SYS_CONNECT_STRING(por defecto: localhost:1521/FREEPDB1)
//   DB_USER / DB_PASSWORD    (usuario y clave que se van a crear)
// ============================================================

require("dotenv").config({ quiet: true });

const oracledb = require("oracledb");

const sysUser = process.env.ORACLE_SYS_USER || "system";
const sysPassword = process.env.ORACLE_SYS_PASSWORD;
const sysConnect = process.env.ORACLE_SYS_CONNECT_STRING || "localhost:1521/FREEPDB1";

const usuario = process.env.DB_USER;
const clave = process.env.DB_PASSWORD;

async function main() {
    if (!sysPassword) {
        console.log("Falta ORACLE_SYS_PASSWORD en el .env (la clave de SYSTEM).");
        process.exitCode = 1;
        return;
    }
    if (!usuario || !clave) {
        console.log("Faltan DB_USER o DB_PASSWORD en el .env.");
        process.exitCode = 1;
        return;
    }

    console.log("Conectando como " + sysUser + "@" + sysConnect + "...");
    let conexion = await oracledb.getConnection({
        user: sysUser,
        password: sysPassword,
        connectString: sysConnect
    });

    try {
        let sentencias = [
            "CREATE USER " + usuario + " IDENTIFIED BY " + clave,
            "GRANT CONNECT, RESOURCE TO " + usuario,
            "GRANT UNLIMITED TABLESPACE TO " + usuario,
            "ALTER USER " + usuario + " QUOTA UNLIMITED ON USERS"
        ];

        for (let i = 0; i < sentencias.length; i++) {
            try {
                await conexion.execute(sentencias[i], {}, { autoCommit: true });
                console.log("  OK: " + sentencias[i]);
            } catch (error) {
                if (error.errorNum === 1920) { // ORA-01920: el usuario ya existe
                    console.log("  (ya existia el usuario, se omite)");
                    continue;
                }
                throw error;
            }
        }

        console.log("\nUsuario \"" + usuario + "\" listo. Ahora corre: node scripts/db.js reiniciar");
    } finally {
        await conexion.close();
    }
}

main().catch(function (error) {
    console.error("\nERROR: " + error.message);
    process.exitCode = 1;
});

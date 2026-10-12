// ============================================================
// Migra las contrasenas que estan en texto plano a hash scrypt.
//
//   npm run db:hashear
//
// Recorre todos los empleados; si la contrasena guardada NO empieza
// por "scrypt$" la hashea y la guarda. Es idempotente: se puede
// correr varias veces sin dañar nada. La migracion tambien se
// ejecuta automaticamente al cargar datos con scripts/db.js.
// ============================================================

require("dotenv").config({ quiet: true });

const database = require("../src/config/database");
const seguridad = require("../src/modules/auth/compartido/seguridad");

// Devuelve cuantas contrasenas quedo migrar, 0 si no queda ninguna.
async function hashearContrasenas() {
    const resultado = await database.ejecutar(
        "SELECT id_empleado, contrasena FROM EMPLEADO",
        {}
    );

    let migradas = 0;

    for (let i = 0; i < resultado.rows.length; i++) {
        const fila = resultado.rows[i];

        if (seguridad.esHash(fila.CONTRASENA)) {
            continue;
        }

        const nuevoHash = seguridad.hashearContrasena(fila.CONTRASENA);

        await database.ejecutar(
            "UPDATE EMPLEADO SET contrasena = :hash WHERE id_empleado = :id",
            {
                hash: nuevoHash,
                id: fila.ID_EMPLEADO
            }
        );

        migradas++;
    }

    return migradas;
}

module.exports = {
    hashearContrasenas: hashearContrasenas
};

// Solo se ejecuta de forma autonoma cuando se llama directo desde node.
if (require.main === module) {
    hashearContrasenas()
        .then(function (migradas) {
            console.log(
                migradas === 0
                    ? "Todas las contrasenas ya estan hasheadas."
                    : "Contrasenas migradas: " + migradas + "."
            );
        })
        .catch(function (error) {
            console.error("\nERROR: " + error.message);
            process.exitCode = 1;
        })
        .finally(function () {
            return database.cerrar();
        });
}
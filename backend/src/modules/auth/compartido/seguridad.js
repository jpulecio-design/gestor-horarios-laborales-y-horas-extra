// ============================================================
// Utilidades de seguridad del modulo de autenticacion.
//
//  - Hash de contrasenas con scrypt (nativo de Node, sin dependencias).
//  - Firma y verificacion de tokens JWT para la sesion.
//
// Formato de una contrasena almacenada:
//     scrypt$<salt en hex>$<hash en hex>
//
// Si el valor guardado NO empieza por "scrypt$" se considera una
// contrasena en texto plano (datos antiguos) y se compara tal cual.
// Asi el sistema sigue funcionando antes de migrar; para migrar
// todo de una vez existe scripts/hashear-contrasenas.js.
// ============================================================

require("dotenv").config({ quiet: true });

const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const PREFIJO = "scrypt$";

// Clave derivada de 24 bytes (48 caracteres hex). Se eligio para que el
// hash completo quepa en la columna CONTRASENA VARCHAR2(120) del esquema:
//   "scrypt$" + 32 hex de sal + "$" + 48 hex de clave = 88 caracteres.
// 192 bits de salida de scrypt mantienen una seguridad adecuada.
const LARGO_CLAVE = 24;

// Clave para firmar los tokens. En produccion debe venir del .env.
const SECRETO = process.env.JWT_SECRET || "clave-de-desarrollo-cambiar-en-produccion";
const EXPIRACION = process.env.JWT_EXPIRES_IN || "8h";

if (!process.env.JWT_SECRET) {
    console.log("AVISO: JWT_SECRET no esta definido en el .env; se usa una clave de desarrollo.");
}

// ------------------------------------------------------------
// Hash de contrasenas
// ------------------------------------------------------------

// Devuelve true si el valor almacenado ya esta hasheado.
function esHash(valor) {
    return typeof valor === "string" && valor.startsWith(PREFIJO);
}

// Convierte una contrasena en texto plano a su representacion con scrypt.
function hashearContrasena(plano) {
    const sal = crypto.randomBytes(16).toString("hex");
    const derivada = crypto.scryptSync(String(plano), sal, LARGO_CLAVE).toString("hex");
    return PREFIJO + sal + "$" + derivada;
}

// Hashea solo si hace falta (si ya viene hasheada o esta vacia, la deja igual).
// Se usa al crear/editar empleados porque el formulario reenvia el valor guardado.
function hashearSiHaceFalta(valor) {
    if (valor === undefined || valor === null || valor === "") {
        return valor;
    }
    if (esHash(valor)) {
        return valor;
    }
    return hashearContrasena(valor);
}

// Compara una contrasena en texto plano con el valor almacenado.
// Acepta tanto valores hasheados (scrypt) como en texto plano (legado).
function verificarContrasena(plano, almacenado) {
    if (plano === undefined || plano === null || almacenado === undefined || almacenado === null) {
        return false;
    }

    if (!esHash(almacenado)) {
        // texto plano heredado: comparacion directa
        return String(plano) === String(almacenado);
    }

    const partes = almacenado.split("$");
    // partes = ["scrypt", sal, hash]
    if (partes.length !== 3) {
        return false;
    }

    const sal = partes[1];
    const esperada = Buffer.from(partes[2], "hex");
    const calculada = crypto.scryptSync(String(plano), sal, esperada.length);

    if (esperada.length !== calculada.length) {
        return false;
    }
    return crypto.timingSafeEqual(esperada, calculada);
}

// ------------------------------------------------------------
// Tokens JWT
// ------------------------------------------------------------

// Firma el token de sesion con los datos minimos del usuario.
function firmarToken(usuario) {
    const carga = {
        id: usuario.id,
        username: usuario.username || usuario.correo,
        rol: usuario.rol
    };
    return jwt.sign(carga, SECRETO, { expiresIn: EXPIRACION });
}

// Verifica un token; devuelve su carga o null si es invalido o expiro.
function verificarToken(token) {
    try {
        return jwt.verify(token, SECRETO);
    } catch (error) {
        return null;
    }
}

module.exports = {
    hashearContrasena: hashearContrasena,
    hashearSiHaceFalta: hashearSiHaceFalta,
    verificarContrasena: verificarContrasena,
    esHash: esHash,
    firmarToken: firmarToken,
    verificarToken: verificarToken
};

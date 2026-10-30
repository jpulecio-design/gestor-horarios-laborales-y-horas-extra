const assert = require("node:assert/strict");
const database = require("../src/config/database");
const seguridad = require("../src/modules/auth/compartido/seguridad");
const controladorAutenticacion = require("../src/modules/auth/compartido/controladorAutenticacion");
const repositorioUsuarios = require("../src/modules/auth/compartido/repositorioUsuarios");
const servicioCorreo = require("../src/modules/auth/compartido/servicioCorreo");
const servicioAutenticacion = require("../src/modules/auth/compartido/servicioAutenticacion");

async function ejecutarPruebas() {
    process.env.RECUPERACION_SECRET = "secreto-de-prueba-suficientemente-largo";
    const contrasena = seguridad.hashearContrasena("clave-segura");
    database.ejecutar = async function (sql, parametros) {
        assert.match(sql, /LOWER\(TRIM\(correo\)\) = LOWER\(TRIM\(:username\)\)/);
        assert.match(parametros.username, /^admin@empresa\.com$/i);
        return {
            rows: [{
                ID_EMPLEADO: 1,
                CORREO: "admin@empresa.com",
                CONTRASENA: contrasena,
                ROL: "Administrador",
                ESTADO: "Activo"
            }]
        };
    };

    const resultado = await servicioAutenticacion.iniciarSesion(
        "  ADMIN@EMPRESA.COM  ",
        "clave-segura"
    );
    assert.equal(resultado.exito, true);
    assert.equal(resultado.usuario.username, "admin@empresa.com");
    assert.equal(typeof resultado.token, "string");

    let codigoEnviado;
    let hashGuardado;
    let hashNuevaContrasena;
    repositorioUsuarios.buscarPorUsername = async function () {
        return {
            id: 1,
            username: "admin@empresa.com",
            estado: "Activo"
        };
    };
    repositorioUsuarios.guardarCodigoRecuperacion = async function (id, hash, expiraEn) {
        assert.equal(id, 1);
        assert.equal(hash.length, 64);
        assert.ok(expiraEn.getTime() > Date.now());
        hashGuardado = hash;
    };
    servicioCorreo.enviarCodigoRecuperacion = async function (destinatario, codigo) {
        assert.equal(destinatario, "admin@empresa.com");
        codigoEnviado = codigo;
    };
    await servicioAutenticacion.solicitarRecuperacion("admin@empresa.com");
    assert.match(codigoEnviado, /^\d{6}$/);

    repositorioUsuarios.cambiarContrasenaConCodigo = async function (id, hash, contrasenaHash) {
        assert.equal(id, 1);
        hashNuevaContrasena = contrasenaHash;
        return hash === hashGuardado;
    };
    await assert.rejects(
        servicioAutenticacion.restablecerContrasena(
            "admin@empresa.com",
            "000000",
            "nueva-clave"
        ),
        (error) => error.statusCode === 400
    );
    const restablecimiento = await servicioAutenticacion.restablecerContrasena(
        "admin@empresa.com",
        codigoEnviado,
        "nueva-clave"
    );
    assert.equal(restablecimiento.exito, true);
    assert.equal(await seguridad.verificarContrasena("nueva-clave", hashNuevaContrasena), true);

    repositorioUsuarios.buscarPorUsername = async function () {
        throw new Error("database unavailable");
    };
    const originalConsoleError = console.error;
    console.error = function () {};
    try {
        let status;
        let body;
        await controladorAutenticacion.iniciarSesion(
            { body: { username: "admin@empresa.com", password: "clave-segura" } },
            {
                status(codigo) {
                    status = codigo;
                    return this;
                },
                json(respuesta) {
                    body = respuesta;
                }
            }
        );
        assert.equal(status, 500);
        assert.match(body.error, /No se pudo validar/);
    } finally {
        console.error = originalConsoleError;
    }

    console.log("Pruebas de autenticacion pasaron.");
}

ejecutarPruebas().catch(function (error) {
    console.error(error);
    process.exitCode = 1;
});

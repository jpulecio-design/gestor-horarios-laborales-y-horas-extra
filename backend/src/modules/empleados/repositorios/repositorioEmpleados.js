const database = require("../../../config/database");

const modeloEmpleado = require("../modelos/empleado");

const COLUMNAS_EMPLEADO =
    "e.id_empleado, e.nombre, e.apellido, e.cedula, e.correo, e.contrasena, " +
    "e.telefono, e.rol, e.estado, e.cargo, e.salario_base, e.telegram_chat_id, " +
    "TO_CHAR(e.fecha_creacion, 'YYYY-MM-DD HH24:MI') AS fecha_creacion, " +
    "TO_CHAR(e.fecha_ingreso, 'YYYY-MM-DD') AS fecha_ingreso";

// Devuelve true si un valor viene vacio
function estaVacio(valor) {
    return valor === undefined || valor === null || valor === "";
}

// Convierte el salario escrito como texto en número o null si esta vacio

function salarioANumero(texto) {
    if (estaVacio(texto)) {
        return null;
    }
    return Number(texto);
}


//  CONSULTAS con SELECT

// devuelve una promesa con todos los empleados 
function obtenerTodos() {
    let sql =
        "SELECT " + COLUMNAS_EMPLEADO + " " +
        "FROM EMPLEADO e " +
        "WHERE e.rol = 'Empleado' " +
        "ORDER BY e.id_empleado";

    return database.ejecutar(sql, {})
        .then(function (resultado) {
            let lista = [];
            for (let i = 0; i < resultado.rows.length; i++) {
                lista.push(modeloEmpleado.crearEmpleadoDesdeFila(resultado.rows[i]));
            }
            return lista;
        });
}

// devuelve una promesa con el empleado de ese id o null si no existe

function buscarEmpleadoPorId(id) {
    let sql =
        "SELECT " + COLUMNAS_EMPLEADO + ", " +
        "       c.nombre AS contacto_nombre, c.telefono AS contacto_telefono, " +
        "       c.parentesco AS contacto_parentesco " +
        "FROM EMPLEADO e " +
        "LEFT JOIN CONTACTO_EMERGENCIA c ON c.id_empleado = e.id_empleado " +
        "WHERE e.id_empleado = :id AND e.rol = 'Empleado' " +
        "ORDER BY c.id_contacto " +
        "FETCH FIRST 1 ROWS ONLY";

    return database.ejecutar(sql, { id: id })
        .then(function (resultado) {
            if (resultado.rows.length === 0) {
                return null; // no lo encontramos
            }
            return modeloEmpleado.crearEmpleadoDesdeFila(resultado.rows[0]);
        });
}

// Devuelve una promesa con true si ya existe otro empleado con esa cedula o correo

function existeCedulaOCorreo(cedula, correo, idAIgnorar) {
    let sql =
        "SELECT COUNT(*) AS total " +
        "FROM EMPLEADO " +
        "WHERE (cedula = :cedula OR correo = :correo) " +
        "AND id_empleado <> :idAIgnorar";

    return database.ejecutar(sql, { cedula: cedula, correo: correo, idAIgnorar: idAIgnorar })
        .then(function (resultado) {
            return resultado.rows[0].TOTAL > 0;
        });
}


//  GUARDAR INSERT / UPDATE

// Inserta un empleado nuevo y si trae contacto tambien su contacto

function insertarEmpleado(datos) {

    let sql =
        "INSERT INTO EMPLEADO " +
        "  (nombre, apellido, cedula, correo, contrasena, telefono, rol, fecha_ingreso, cargo, salario_base, telegram_chat_id) " +
        "VALUES " +
        "  (:nombre, :apellido, :cedula, :correo, :contrasena, :telefono, 'Empleado', " +
        "   TO_DATE(:fechaIngreso, 'YYYY-MM-DD'), :cargo, :salarioBase, :telegramChatId) " +
        "RETURNING id_empleado INTO :id";

    let parametros = {
        nombre: datos.nombre,
        apellido: datos.apellido,
        cedula: datos.cedula,
        correo: datos.correo,
        contrasena: datos.contrasena,
        telefono: datos.telefono,
        fechaIngreso: datos.fechaIngreso,
        cargo: datos.cargo,
        salarioBase: salarioANumero(datos.salarioBase),
        telegramChatId: datos.telegramChatId,
        id: { dir: database.oracledb.BIND_OUT, type: database.oracledb.NUMBER }
    };

    return database.ejecutar(sql, parametros)
        .then(function (resultado) {
            let idNuevo = resultado.outBinds.id[0]; 

            if (estaVacio(datos.contactoNombre)) {
                return idNuevo; // sin contacto aqui acaba
            }

            // guardamos el contacto y despues devolvemos el id
            return insertarContacto(idNuevo, datos)
                .then(function () {
                    return idNuevo;
                });
        });
}

// actualiza los datos de un empleado existente y su contacto
// devuelve una promesa que termina cuando todo se guardo
function actualizarEmpleado(id, datos) {
    let sql =
        "UPDATE EMPLEADO SET " +
        "  nombre = :nombre, apellido = :apellido, cedula = :cedula, correo = :correo, " +
        "  contrasena = :contrasena, telefono = :telefono, " +
        "  fecha_ingreso = TO_DATE(:fechaIngreso, 'YYYY-MM-DD'), " +
        "  cargo = :cargo, salario_base = :salarioBase, telegram_chat_id = :telegramChatId " +
        "WHERE id_empleado = :id";

    let parametros = {
        nombre: datos.nombre,
        apellido: datos.apellido,
        cedula: datos.cedula,
        correo: datos.correo,
        contrasena: datos.contrasena,
        telefono: datos.telefono,
        fechaIngreso: datos.fechaIngreso,
        cargo: datos.cargo,
        salarioBase: salarioANumero(datos.salarioBase),
        telegramChatId: datos.telegramChatId,
        id: id
    };

    return database.ejecutar(sql, parametros)
        .then(function () {
            return guardarContacto(id, datos);
        });
}


// CONTACTO DE EMERGENCIA

function insertarContacto(idEmpleado, datos) {
    let sql =
        "INSERT INTO CONTACTO_EMERGENCIA (id_empleado, nombre, telefono, parentesco) " +
        "VALUES (:idEmpleado, :nombre, :telefono, :parentesco)";

    return database.ejecutar(sql, {
        idEmpleado: idEmpleado,
        nombre: datos.contactoNombre,
        telefono: datos.contactoTelefono,
        parentesco: datos.contactoParentesco
    });
}

// Si el empleado ya tiene contacto lo actualiza si no se tiene se crea

function guardarContacto(idEmpleado, datos) {
    if (estaVacio(datos.contactoNombre)) {
        return Promise.resolve(); // promesa que ya termino sin hacer nada
    }

    let sql =
        "UPDATE CONTACTO_EMERGENCIA " +
        "SET nombre = :nombre, telefono = :telefono, parentesco = :parentesco " +
        "WHERE id_empleado = :idEmpleado";

    return database.ejecutar(sql, {
        nombre: datos.contactoNombre,
        telefono: datos.contactoTelefono,
        parentesco: datos.contactoParentesco,
        idEmpleado: idEmpleado
    })
        .then(function (resultado) {
            if (resultado.rowsAffected === 0) {
                return insertarContacto(idEmpleado, datos);
            }
        });
}

module.exports = {
    obtenerTodos: obtenerTodos,
    buscarEmpleadoPorId: buscarEmpleadoPorId,
    existeCedulaOCorreo: existeCedulaOCorreo,
    insertarEmpleado: insertarEmpleado,
    actualizarEmpleado: actualizarEmpleado
};
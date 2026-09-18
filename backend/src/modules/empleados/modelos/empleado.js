const usuario = require("./usuario");

// convierte null en "" y cualquier otro valor en texto
function textoOVacio(valor) {
    if (valor === null || valor === undefined) {
        return "";
    }
    return String(valor); // 
}

// arma el objeto "empleado" a partir de una fila de la consulta

function crearEmpleadoDesdeFila(fila) {
    let empleado = {
        usuario: usuario.crearMoldeUsuario(
            fila.ID_EMPLEADO,            
            textoOVacio(fila.NOMBRE),
            textoOVacio(fila.APELLIDO),
            textoOVacio(fila.CEDULA),
            textoOVacio(fila.CORREO),
            textoOVacio(fila.CONTRASENA),
            textoOVacio(fila.TELEFONO),
            textoOVacio(fila.ROL),
            textoOVacio(fila.ESTADO),
            textoOVacio(fila.FECHA_CREACION)
        ),
        
        fechaIngreso: textoOVacio(fila.FECHA_INGRESO),
        cargo: textoOVacio(fila.CARGO),
        salarioBase: textoOVacio(fila.SALARIO_BASE),
        // si esta vacio el aviso le llega al administrador
        telegramChatId: textoOVacio(fila.TELEGRAM_CHAT_ID),

        contactoEmergencia: {
            nombre: textoOVacio(fila.CONTACTO_NOMBRE),
            telefono: textoOVacio(fila.CONTACTO_TELEFONO),
            parentesco: textoOVacio(fila.CONTACTO_PARENTESCO)
        }
    };

    return empleado;
}

module.exports = {
    crearEmpleadoDesdeFila: crearEmpleadoDesdeFila
};
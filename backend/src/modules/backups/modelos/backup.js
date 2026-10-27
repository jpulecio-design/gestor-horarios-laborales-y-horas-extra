function textoOVacio(valor) {
    if (valor === null || valor === undefined) {
        return "";
    }
    return String(valor);
}

function crearBackupDesdeFila(fila) {
    let backup = {
        id: fila.ID_BACKUP,
        fechaHora: textoOVacio(fila.FECHA_HORA),
        nombreArchivo: textoOVacio(fila.NOMBRE_ARCHIVO),
        tipo: textoOVacio(fila.TIPO),
        estado: textoOVacio(fila.ESTADO),
        idEmpleado: fila.ID_EMPLEADO,
        generadoPor: textoOVacio(fila.GENERADO_POR),
        intentos: fila.INTENTOS,
        tamanoBytes: fila.TAMANO_BYTES,
        detalleError: textoOVacio(fila.DETALLE_ERROR)
    };

    return backup;
}

module.exports = {
    crearBackupDesdeFila: crearBackupDesdeFila
};

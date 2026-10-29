function armarMensajeExito(backup) {
    let mensaje =
        "Backup automático generado correctamente\n" +
        "Fecha: " + backup.fechaHora + "\n" +
        "Archivo: " + backup.nombreArchivo + " (" + backup.tamanoBytes + " bytes)\n" +
        "Intentos: " + backup.intentos + "\n" +
        "Para descargarlo en Excel: menú \"Seguridad y Backups\", opción 4.";

    return mensaje;
}

function armarMensajeFallo(fechaTexto, intentos, detalleError) {
    let mensaje =
        "ALERTA - Backup automático fallido\n" +
        "Fecha: " + fechaTexto + "\n" +
        "Intentos realizados: " + intentos + "\n" +
        "Error: " + detalleError + "\n" +
        "Revisa el espacio en disco y la conexión con la base de datos, " +
        "y genera una copia manual desde \"Seguridad y Backups\".";

    return mensaje;
}

module.exports = {
    armarMensajeExito: armarMensajeExito,
    armarMensajeFallo: armarMensajeFallo
};

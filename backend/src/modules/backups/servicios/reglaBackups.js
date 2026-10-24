const DIAS_ENTRE_BACKUPS = 5;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

function textoAFecha(texto) {
    return new Date(texto.replace(" ", "T"));
}

function dosDigitos(numero) {
    return String(numero).padStart(2, "0");
}

function fechaATexto(fecha) {
    return fecha.getFullYear() + "-" + dosDigitos(fecha.getMonth() + 1) + "-" + dosDigitos(fecha.getDate()) +
        " " + dosDigitos(fecha.getHours()) + ":" + dosDigitos(fecha.getMinutes()) + ":" + dosDigitos(fecha.getSeconds());
}

function diasDesde(fechaTexto, ahora) {
    return Math.floor((ahora.getTime() - textoAFecha(fechaTexto).getTime()) / MS_POR_DIA);
}

function necesitaBackup(fechaUltimo, ahora) {
    if (fechaUltimo === null) {
        return true;
    }
    return ahora.getTime() - fechaUltimo.getTime() >= DIAS_ENTRE_BACKUPS * MS_POR_DIA;
}

function fechaProximoBackup(fechaUltimo) {
    if (fechaUltimo === null) {
        return null;
    }
    return new Date(fechaUltimo.getTime() + DIAS_ENTRE_BACKUPS * MS_POR_DIA);
}

module.exports = {
    DIAS_ENTRE_BACKUPS: DIAS_ENTRE_BACKUPS,
    MS_POR_DIA: MS_POR_DIA,
    textoAFecha: textoAFecha,
    fechaATexto: fechaATexto,
    diasDesde: diasDesde,
    necesitaBackup: necesitaBackup,
    fechaProximoBackup: fechaProximoBackup
};

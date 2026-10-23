const CAMPOS_OCULTOS = ["CONTRASENA"];
const TEXTO_OCULTO = "********";

function esCampoOculto(campo) {
    return CAMPOS_OCULTOS.indexOf(campo) !== -1;
}

function registroVisible(fila) {
    let copia = {};
    for (let campo in fila) {
        copia[campo] = esCampoOculto(campo) ? TEXTO_OCULTO : fila[campo];
    }
    return copia;
}

function indexarPorPk(filas, pk) {
    let indice = {};
    for (let i = 0; i < filas.length; i++) {
        indice[String(filas[i][pk])] = filas[i];
    }
    return indice;
}

function unirLlaves(a, b) {
    let llaves = Object.keys(a);
    let deB = Object.keys(b);
    for (let i = 0; i < deB.length; i++) {
        if (llaves.indexOf(deB[i]) === -1) {
            llaves.push(deB[i]);
        }
    }
    return llaves;
}

function camposCambiados(filaRespaldo, filaActual) {
    let cambios = [];
    let campos = unirLlaves(filaRespaldo, filaActual);

    for (let i = 0; i < campos.length; i++) {
        let campo = campos[i];
        let antes = filaRespaldo[campo] === undefined ? null : filaRespaldo[campo];
        let despues = filaActual[campo] === undefined ? null : filaActual[campo];

        if (JSON.stringify(antes) === JSON.stringify(despues)) {
            continue;
        }

        if (esCampoOculto(campo)) {
            cambios.push({ campo: campo, antes: TEXTO_OCULTO, despues: TEXTO_OCULTO + " (modificada)" });
        } else {
            cambios.push({ campo: campo, antes: antes, despues: despues });
        }
    }

    return cambios;
}

function compararTabla(nombre, pk, filasRespaldo, filasActuales) {
    let enRespaldo = indexarPorPk(filasRespaldo, pk);
    let enActual = indexarPorPk(filasActuales, pk);

    let resultado = {
        tabla: nombre,
        pk: pk,
        nuevos: [],
        eliminados: [],
        modificados: []
    };

    for (let id in enActual) {
        if (enRespaldo[id] === undefined) {
            resultado.nuevos.push({ id: id, registro: registroVisible(enActual[id]) });
        } else {
            let cambios = camposCambiados(enRespaldo[id], enActual[id]);
            if (cambios.length > 0) {
                resultado.modificados.push({ id: id, campos: cambios });
            }
        }
    }

    for (let id in enRespaldo) {
        if (enActual[id] === undefined) {
            resultado.eliminados.push({ id: id, registro: registroVisible(enRespaldo[id]) });
        }
    }

    return resultado;
}

function compararDatos(tablasRespaldo, tablasActuales) {
    let informe = {
        hayDiferencias: false,
        totales: { nuevos: 0, eliminados: 0, modificados: 0 },
        tablas: []
    };

    let nombres = unirLlaves(tablasRespaldo, tablasActuales);

    for (let i = 0; i < nombres.length; i++) {
        let nombre = nombres[i];
        let respaldo = tablasRespaldo[nombre] || { filas: [] };
        let actual = tablasActuales[nombre] || { filas: [] };
        let pk = actual.pk || respaldo.pk;

        let resultado = compararTabla(nombre, pk, respaldo.filas, actual.filas);

        informe.totales.nuevos += resultado.nuevos.length;
        informe.totales.eliminados += resultado.eliminados.length;
        informe.totales.modificados += resultado.modificados.length;
        informe.tablas.push(resultado);
    }

    let t = informe.totales;
    informe.hayDiferencias = t.nuevos + t.eliminados + t.modificados > 0;

    return informe;
}

module.exports = {
    CAMPOS_OCULTOS: CAMPOS_OCULTOS,
    compararDatos: compararDatos
};

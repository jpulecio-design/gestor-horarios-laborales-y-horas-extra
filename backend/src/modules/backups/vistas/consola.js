const prompt = require("prompt-sync")({ sigint: true });

function pedirCredenciales() {
    console.log("\n=== SEGURIDAD Y BACKUPS (solo Administrador) ===");
    let correo = prompt("Correo: ");
    let clave = prompt.hide("Contraseña: ");
    return { correo: correo, clave: clave };
}

function mostrarEstado(estado) {
    if (estado.ultimoRespaldo === null) {
        console.log("\nAún no hay ningún respaldo exitoso.");
        return;
    }
    console.log(
        "\nÚltimo respaldo exitoso: " + estado.ultimoRespaldo.fechaHora +
        " (" + estado.ultimoRespaldo.tipo + ", hace " + estado.diasDesdeUltimo + " día(s))"
    );
}

function mostrarHistorial(historial, carpeta) {
    console.log("\n===== HISTÓRICO DE RESPALDOS =====");

    if (historial.length === 0) {
        console.log("No hay respaldos registrados.");
        return;
    }

    for (let i = 0; i < historial.length; i++) {
        let b = historial[i];
        let quien = b.generadoPor !== "" ? b.generadoPor : "Sistema";
        let detalle = b.estado === "Exitoso"
            ? b.nombreArchivo + " (" + b.tamanoBytes + " bytes)"
            : "Error: " + b.detalleError;

        console.log(
            "ID: " + b.id +
            " | " + b.fechaHora +
            " | " + b.tipo +
            " | " + b.estado +
            " | Por: " + quien +
            " | Intentos: " + b.intentos +
            " | " + detalle
        );
    }

    console.log("Los archivos están en: " + carpeta);
}

function pedirRespaldoAComparar(historial) {
    console.log("\n--- Respaldos disponibles para comparar ---");
    for (let i = 0; i < historial.length; i++) {
        let b = historial[i];
        if (b.estado === "Exitoso") {
            console.log("ID: " + b.id + " | " + b.fechaHora + " | " + b.tipo + " | " + b.nombreArchivo);
        }
    }
    return Number(prompt("ID del respaldo de referencia: "));
}

function pedirRespaldoADescargar(historial, ultimo) {
    console.log("\n--- Respaldos disponibles para descargar ---");
    for (let i = 0; i < historial.length; i++) {
        let b = historial[i];
        if (b.estado === "Exitoso") {
            console.log("ID: " + b.id + " | " + b.fechaHora + " | " + b.tipo + " | " + b.nombreArchivo);
        }
    }

    let respuesta = prompt("ID del respaldo [" + ultimo.id + " = el último]: ");
    if (respuesta === "") {
        return ultimo.id;
    }
    return Number(respuesta);
}

function pedirFormato() {
    console.log("Formato:  1. Excel (.xlsx)   2. JSON (copia completa)");
    let respuesta = prompt("Elige el formato [1]: ");
    if (respuesta === "2") {
        return "json";
    }
    return "excel";
}

function columna(texto, ancho) {
    return String(texto).padEnd(ancho);
}

function resumirRegistro(registro, pk) {
    let partes = [];
    for (let campo in registro) {
        if (campo !== pk && partes.length < 3) {
            partes.push(campo + "=" + registro[campo]);
        }
    }
    return partes.join(", ");
}

function mostrarComparacion(informe) {
    console.log("\n===== COMPARACIÓN CON RESPALDO =====");
    console.log("Respaldo: ID " + informe.respaldo.id + " del " + informe.respaldo.fechaHora +
        "  vs  estado actual (" + informe.fechaComparacion + ")");

    console.log("\n" + columna("TABLA", 26) + columna("NUEVOS", 9) + columna("ELIMINADOS", 12) + "MODIFICADOS");
    for (let i = 0; i < informe.tablas.length; i++) {
        let t = informe.tablas[i];
        console.log(columna(t.tabla, 26) + columna(t.nuevos.length, 9) +
            columna(t.eliminados.length, 12) + t.modificados.length);
    }
    console.log(columna("TOTAL", 26) + columna(informe.totales.nuevos, 9) +
        columna(informe.totales.eliminados, 12) + informe.totales.modificados);

    if (!informe.hayDiferencias) {
        console.log("\nSin diferencias: los datos actuales coinciden con el respaldo.");
        return;
    }

    for (let i = 0; i < informe.tablas.length; i++) {
        let t = informe.tablas[i];
        if (t.nuevos.length + t.eliminados.length + t.modificados.length === 0) {
            continue;
        }

        console.log("\n--- " + t.tabla + " ---");
        for (let j = 0; j < t.nuevos.length; j++) {
            console.log("  [NUEVO]      " + t.pk + " " + t.nuevos[j].id + ": " + resumirRegistro(t.nuevos[j].registro, t.pk));
        }
        for (let j = 0; j < t.eliminados.length; j++) {
            console.log("  [ELIMINADO]  " + t.pk + " " + t.eliminados[j].id + ": " + resumirRegistro(t.eliminados[j].registro, t.pk));
        }
        for (let j = 0; j < t.modificados.length; j++) {
            let m = t.modificados[j];
            console.log("  [MODIFICADO] " + t.pk + " " + m.id + ":");
            for (let k = 0; k < m.campos.length; k++) {
                let c = m.campos[k];
                console.log("      " + c.campo + ": '" + c.antes + "' -> '" + c.despues + "'");
            }
        }
    }
}

function mostrarMenu() {
    console.log("\n========= SEGURIDAD Y BACKUPS =========");
    console.log("1. Generar copia de seguridad");
    console.log("2. Ver respaldos");
    console.log("3. Comparar con respaldo");
    console.log("4. Descargar respaldo (Excel o JSON)");
    console.log("0. Salir");
    return prompt("Elige una opción: ");
}

module.exports = {
    pedirCredenciales: pedirCredenciales,
    pedirRespaldoAComparar: pedirRespaldoAComparar,
    pedirRespaldoADescargar: pedirRespaldoADescargar,
    pedirFormato: pedirFormato,
    mostrarComparacion: mostrarComparacion,
    mostrarEstado: mostrarEstado,
    mostrarHistorial: mostrarHistorial,
    mostrarMenu: mostrarMenu
};

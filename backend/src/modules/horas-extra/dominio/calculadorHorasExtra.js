// Factor de recargo por tipo de hora extra (legislación laboral)
// Diurna = 25%, Nocturna = 75%, Festiva/Dominical = 100%
const RECARGOS = {
    "Diurna": 1.25,
    "Nocturna": 1.75,
    "Festiva": 2.0
};

function tipoValido(tipo) {
    return Object.prototype.hasOwnProperty.call(RECARGOS, tipo);
}

function factorRecargo(tipo) {
    return RECARGOS[tipo];
}

// devuelve el valor calculado de la hora extra
// valorHoraBase * factor(tipo) * cantidadHoras
function calcularValor(tipo, valorHoraBase, cantidadHoras) {
    let valor = valorHoraBase * RECARGOS[tipo] * cantidadHoras;
    return Math.round(valor * 100) / 100;
}

module.exports = {
    tipoValido: tipoValido,
    factorRecargo: factorRecargo,
    calcularValor: calcularValor
};
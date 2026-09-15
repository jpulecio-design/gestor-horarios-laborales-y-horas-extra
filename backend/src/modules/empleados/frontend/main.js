// ============================================
// main.js
// RESPONSABILIDAD: conectar todo (event listener). Arranque de la app.
// ============================================
// Como los scripts están al final del body, este elemento ya existe cuando
// llegamos aquí, así que podemos engancharle el evento directamente.
document.getElementById("btnGuardar").addEventListener("click", manejarClicGuardar);
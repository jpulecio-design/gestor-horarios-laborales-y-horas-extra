// ============================================
// estado.js
// RESPONSABILIDAD: guardar el estado global de la aplicación.
// ============================================
// Aqui guardamos todo "en memoria" sin conexuion a base de datos

let empleados = []; // Array que va a contener todos los objetos "empleado".

let contadorId = 1; // Cada empleado nuevo recibe un id distinto (1, 2, 3...).

let idEnEdicion = null;
// Esta variable nos dice si el formulario esta CREANDO o EDITANDO:
// - null            -> estamos creando un empleado nuevo
// - un numero (id)  -> estamos editando ese empleado
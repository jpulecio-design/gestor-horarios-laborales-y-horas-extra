 const MOCK_USUARIOS = [
  { correo: "buchelito@empresa.com",   contrasena: "clave123", rol: "Empleado",      estado: "Activo"   },
  { correo: "admin@empresa.com",    contrasena: "admin123", rol: "Administrador", estado: "Activo"   },
  { correo: "puleSSland@empresa.com",    contrasena: "clave123", rol: "Contadora",     estado: "Activo"   },
  { correo: "yotas@empresa.com", contrasena: "clave123", rol: "Empleado",      estado: "Inactivo" }, // para probar FA2
];

const form = document.getElementById("loginForm");
const mensajeError = document.getElementById("mensajeError");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const correo = document.getElementById("correo").value.trim().toLowerCase();
  const contrasena = document.getElementById("contrasena").value;

  mensajeError.textContent = "";

  verificarCredenciales(correo, contrasena);
});

function verificarCredenciales(correo, contrasena) {
  const usuario = MOCK_USUARIOS.find(u => u.correo.toLowerCase() === correo);

  if (!usuario || usuario.contrasena !== contrasena) {
    mensajeError.textContent = "Usuario o contraseña incorrectos";
    return;
  }

  if (usuario.estado !== "Activo") {
    mensajeError.textContent = "Cuenta inactiva";
    return;
  }

  guardarSesion(usuario);
  redirigirSegunRol(usuario.rol);
}

function guardarSesion(usuario) {
 
  sessionStorage.setItem("correo", usuario.correo);
  sessionStorage.setItem("rol", usuario.rol);
}

function redirigirSegunRol(rol) {

  alert(
    "Inicio de sesión exitoso ✅\n" +
    "Rol detectado: " + rol + "\n\n" +
    "El panel para este rol aún no está desarrollado. " +
    "Contacta al administrador del sistema."
  );
}
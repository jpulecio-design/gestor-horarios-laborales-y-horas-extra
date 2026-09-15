// ============================================
// telegram.js
// RESPONSABILIDAD: armar y enviar el aviso a Telegram
// ============================================

// --- MINI CLASE: ¿qué es fetch()? ---
// fetch() es la función que usa JavaScript para pedirle algo a otro servidor
// por internet (aquí, al servidor de Telegram). Pedir algo por internet NO es
// instantáneo: el navegador tiene que esperar la respuesta. Por eso fetch()
// no te devuelve el resultado directamente, te devuelve una "promesa" (un
// "recibo" que dice: "en cuanto tenga la respuesta, te aviso"). Para
// reaccionar cuando llega esa respuesta se usa .then(...). Ejemplo mínimo:
//
//   fetch("https://alguna-pagina.com/datos")
//     .then(function (respuesta) {
//       console.log("Ya llegó la respuesta:", respuesta);
//     })
//     .catch(function (error) {
//       console.log("Algo salió mal:", error);
//     });
//
// .then() corre SI la petición salió bien.
// .catch() corre SI hubo un error (por ejemplo, no hay internet)
// No usamos async/await porque me pediste evitarlo: con .then()/.catch()
// alcanza perfectamente para esto

// Estos dos datos te los da Telegram al crear tu "bot". Los completas tú después
const TELEGRAM_API_KEY = "AQUI_VA_TU_API_KEY";   // token del bot, ej: "123456:ABC-DEF..."
const TELEGRAM_CHAT_ID = "AQUI_VA_EL_CHAT_ID";   // id del chat que recibe el aviso

// Arma el TEXTO del mensaje a partir del empleado y la lista de cambios
function armarMensajeTelegram(empleado, cambios) {
    let mensaje = "Hola " + empleado.usuario.nombre + ", se actualizaron tus datos:\n";

    for (let i = 0; i < cambios.length; i++) {
        mensaje = mensaje + "- " + cambios[i] + "\n";
    }

    return mensaje;
}

// Envía el mensaje ya armado a la API de Telegram
// La URL siempre sigue este formato:
// https://api.telegram.org/bot<API_KEY>/sendMessage?chat_id=<CHAT_ID>&text=<MENSAJE>
function enviarMensajeTelegram(mensaje) {
    // encodeURIComponent() convierte espacios, tildes y saltos de línea a un
    // formato seguro para viajar dentro de una URL (por ejemplo, un espacio se
    // convierte en %20). Es necesario porque una URL no puede llevar esos
    // caracteres "tal cual".
    let mensajeParaUrl = encodeURIComponent(mensaje);

    let url =
        "https://api.telegram.org/bot" + TELEGRAM_API_KEY +
        "/sendMessage?chat_id=" + TELEGRAM_CHAT_ID +
        "&text=" + mensajeParaUrl;

    fetch(url)
        .then(function (respuesta) {
            // respuesta.ok es true si Telegram respondió sin errores (código 200-299)
            if (respuesta.ok) {
                console.log("Mensaje enviado a Telegram correctamente.");
            } else {
                console.log("Telegram respondió con un error.");
            }
        })
        .catch(function (error) {
            console.log("No se pudo conectar con Telegram:", error);
        });
}
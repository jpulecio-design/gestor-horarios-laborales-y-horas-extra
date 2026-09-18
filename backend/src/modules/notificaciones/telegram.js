require("dotenv").config({ quiet: true });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; // "contraseña" del bot
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;     // chat del administrador (de respaldo)

// Devuelve true si un valor viene vacío.
function estaVacio(valor) {
    return valor === undefined || valor === null || valor === "";
}

function enviarMensaje(chatId, texto) {
    // se manda al chat  del empleado si tiene si no al del administrador
    if (estaVacio(chatId)) {
        chatId = TELEGRAM_CHAT_ID;
    }

    // si falta configuracion avisamos y devolvemos una promesa ya terminada
    if (estaVacio(TELEGRAM_BOT_TOKEN) || estaVacio(chatId)) {
        console.log("Telegram no está configurado: revisa TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en el archivo .env");
        return Promise.resolve(false);
    }

    //    Armar la URL. Telegram usa siempre este formato:
    //    https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT>&text=<TEXTO>
    //    encodeURIComponent() convierte espacios, tildes y saltos de línea a un
    //    formato que puede viajar dentro de una URL 
    let url =
        "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN +
        "/sendMessage?chat_id=" + encodeURIComponent(chatId) +
        "&text=" + encodeURIComponent(texto);

    //  Hacer la petición con fetch() 
    return fetch(url)
        .then(function (respuesta) {
            return respuesta.json();
        })
        .then(function (datos) {
            if (datos.ok) {
                console.log("Aviso enviado a Telegram correctamente (chat " + chatId + ").");
                return true;
            }
            console.log("Telegram rechazó el mensaje: " + datos.description);
            return false;
        })
        .catch(function (error) {
            console.log("No se pudo conectar con Telegram: " + error.message);
            return false;
        });
}

module.exports = {
    enviarMensaje: enviarMensaje
};
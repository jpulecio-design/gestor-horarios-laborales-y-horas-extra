const telegram = require("../src/modules/notificaciones/telegram");

console.log("Enviando mensaje de prueba a Telegram...");

telegram.enviarMensaje("", "Prueba de conexión desde el Gestor de Horarios Laborales.")
    .then(function (enviado) {
        if (enviado) {
            console.log("Revisa tu Telegram: debe haber llegado el mensaje.");
        }
    });
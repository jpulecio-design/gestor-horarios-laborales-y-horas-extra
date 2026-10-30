require("dotenv").config({ quiet: true });

const nodemailer = require("nodemailer");

async function enviarCodigoRecuperacion(destinatario, codigo) {
    const usuario = process.env.SMTP_USER;
    const contrasenaAplicacion = process.env.SMTP_APP_PASSWORD;

    if (!usuario || !contrasenaAplicacion) {
        throw new Error("Configura SMTP_USER y SMTP_APP_PASSWORD en backend/.env.");
    }

    const transporte = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: usuario,
            pass: contrasenaAplicacion.replace(/\s/g, "")
        }
    });

    await transporte.sendMail({
        from: `"Gestor de Horarios" <${usuario}>`,
        to: destinatario,
        subject: "Código para restablecer tu contraseña",
        text:
            `Tu código para restablecer la contraseña es: ${codigo}\n\n` +
            "El código vence en 10 minutos. Si no solicitaste este cambio, ignora este correo.",
        html:
            `<p>Tu código para restablecer la contraseña es:</p>` +
            `<p style="font-size:28px;font-weight:bold;letter-spacing:6px">${codigo}</p>` +
            "<p>El código vence en 10 minutos. Si no solicitaste este cambio, ignora este correo.</p>"
    });
}

module.exports = { enviarCodigoRecuperacion: enviarCodigoRecuperacion };

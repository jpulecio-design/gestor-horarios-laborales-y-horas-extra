const servicioAutenticacion = require("../src/modules/auth/compartido/servicios/servicioAutenticacion");

console.log("PRUEBA 1");
console.log(
    servicioAutenticacion.iniciarSesion(
        "admin@empresa.com",
        "admin123"
    )
);

console.log("PRUEBA 2");
console.log(
    servicioAutenticacion.iniciarSesion(
        "admin@empresa.com",
        "incorrecta"
    )
);

console.log("PRUEBA 3");
console.log(
    servicioAutenticacion.iniciarSesion(
        "noexiste@empresa.com",
        "123456"
    )
);

console.log("PRUEBA 4");
console.log(
    servicioAutenticacion.iniciarSesion(
        "inactivo@empresa.com",
        "clave123"
    )
);
console.log("PRUEBA DEL CONTROLADOR");

const controladorAutenticacion = require(
    "../src/modules/auth/compartido/controladores/controladorAutenticacion"
);

const req = {
    body: {
        username: "admin@empresa.com",
        password: "admin123"
    }
};

const res = {
    json: function(resultado) {
        console.log(resultado);
    }
};

controladorAutenticacion.iniciarSesion(req, res);
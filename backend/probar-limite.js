const BASE = "http://localhost:3000";
const ID = 6;

(async () => {
  const login = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin@empresa.com", password: "admin123" })
  });
  const { token } = await login.json();

  const dias = [];
  for (let i = 1; i <= 1000; i++) {
    const fecha = new Date(Date.now() + i * 86400000).toISOString().slice(0, 10);
    dias.push({ fecha, horaEntrada: "08:00", horaSalida: "17:00", tipoTurno: "Diurno" });
  }
  console.log("Empleado:", ID);
  console.log("Dias enviados:", dias.length);

  const r = await fetch(`${BASE}/api/horarios/programacion/${ID}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ dias })
  });
  console.log("Estado HTTP:", r.status);
  console.log(await r.text());
})();
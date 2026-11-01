-- ============================================================
-- Datos de ejemplo para el prototipo.
-- Se ejecuta despues de db/esquema.sql (o con: node scripts/db.js datos).
--
-- Usuarios para iniciar sesion:
--   admin@empresa.com    / admin123   (Administrador)
--   conta@empresa.com    / conta123   (Contadora)
--   carlos@empresa.com   / clave123   (Empleado)
--   maria@empresa.com    / clave123   (Empleado)
--   jose@empresa.com     / clave123   (Empleado)
--
-- Los empleados de ejemplo ya traen codigo_qr para poder probar el
-- registro de asistencia por QR desde el frontend.
-- ============================================================

-- -------------------- Usuarios / empleados --------------------
INSERT INTO EMPLEADO (nombre, apellido, cedula, correo, contrasena, telefono, rol, estado, cargo, salario_base, fecha_ingreso, codigo_qr)
VALUES ('Administrador', 'Sistema', 'ADMIN-001', 'admin@empresa.com', 'admin123', '3000000001', 'Administrador', 'Activo', 'Administrador', NULL, TO_DATE('2025-01-02','YYYY-MM-DD'), NULL);

INSERT INTO EMPLEADO (nombre, apellido, cedula, correo, contrasena, telefono, rol, estado, cargo, salario_base, fecha_ingreso, codigo_qr)
VALUES ('Laura', 'Contreras', 'CONTA-001', 'conta@empresa.com', 'conta123', '3000000002', 'Contadora', 'Activo', 'Contadora', 3200000, TO_DATE('2025-01-15','YYYY-MM-DD'), NULL);

INSERT INTO EMPLEADO (nombre, apellido, cedula, correo, contrasena, telefono, rol, estado, cargo, salario_base, fecha_ingreso, codigo_qr)
VALUES ('Carlos', 'Gomez', '1001', 'carlos@empresa.com', 'clave123', '3001112233', 'Empleado', 'Activo', 'Cajero', 1500000, TO_DATE('2026-01-15','YYYY-MM-DD'), 'EMPQR-DEMO-CARLOS');

INSERT INTO EMPLEADO (nombre, apellido, cedula, correo, contrasena, telefono, rol, estado, cargo, salario_base, fecha_ingreso, codigo_qr)
VALUES ('Maria', 'Rodriguez', '1002', 'maria@empresa.com', 'clave123', '3001114455', 'Empleado', 'Activo', 'Vigilante', 1400000, TO_DATE('2026-02-01','YYYY-MM-DD'), 'EMPQR-DEMO-MARIA');

INSERT INTO EMPLEADO (nombre, apellido, cedula, correo, contrasena, telefono, rol, estado, cargo, salario_base, fecha_ingreso, codigo_qr)
VALUES ('Jose', 'Martinez', '1003', 'jose@empresa.com', 'clave123', '3001116677', 'Empleado', 'Activo', 'Auxiliar de bodega', 1300000, TO_DATE('2026-03-10','YYYY-MM-DD'), 'EMPQR-DEMO-JOSE');


-- -------------------- Contactos de emergencia --------------------
INSERT INTO CONTACTO_EMERGENCIA (id_empleado, nombre, telefono, parentesco)
SELECT id_empleado, 'Luis Gomez', '3104445566', 'Padre' FROM EMPLEADO WHERE correo = 'carlos@empresa.com';

INSERT INTO CONTACTO_EMERGENCIA (id_empleado, nombre, telefono, parentesco)
SELECT id_empleado, 'Sara Rodriguez', '3102223344', 'Madre' FROM EMPLEADO WHERE correo = 'maria@empresa.com';

INSERT INTO CONTACTO_EMERGENCIA (id_empleado, nombre, telefono, parentesco)
SELECT id_empleado, 'Ana Martinez', '3105554433', 'Hermana' FROM EMPLEADO WHERE correo = 'jose@empresa.com';


-- -------------------- Turnos --------------------
INSERT INTO TURNO (nombre, hora_entrada, hora_salida, dias) VALUES ('Diurno', '08:00', '17:00', '1,2,3,4,5');
INSERT INTO TURNO (nombre, hora_entrada, hora_salida, dias) VALUES ('Nocturno', '22:00', '06:00', '1,2,3,4,5');
INSERT INTO TURNO (nombre, hora_entrada, hora_salida, dias) VALUES ('Fin de semana', '08:00', '12:00', '6,7');


-- -------------------- Asignaciones de horario --------------------
INSERT INTO ASIGNACION_HORARIO (id_empleado, id_turno, fecha_desde, fecha_hasta)
SELECT e.id_empleado, t.id_turno, TO_DATE('2026-01-01','YYYY-MM-DD'), NULL
FROM EMPLEADO e, TURNO t
WHERE e.correo = 'carlos@empresa.com' AND t.nombre = 'Diurno';

INSERT INTO ASIGNACION_HORARIO (id_empleado, id_turno, fecha_desde, fecha_hasta)
SELECT e.id_empleado, t.id_turno, TO_DATE('2026-01-01','YYYY-MM-DD'), NULL
FROM EMPLEADO e, TURNO t
WHERE e.correo = 'maria@empresa.com' AND t.nombre = 'Diurno';

INSERT INTO ASIGNACION_HORARIO (id_empleado, id_turno, fecha_desde, fecha_hasta)
SELECT e.id_empleado, t.id_turno, TO_DATE('2026-01-01','YYYY-MM-DD'), NULL
FROM EMPLEADO e, TURNO t
WHERE e.correo = 'jose@empresa.com' AND t.nombre = 'Nocturno';


-- -------------------- Asistencia de ejemplo (Carlos) --------------------
INSERT INTO ASISTENCIA (id_empleado, tipo, fecha_hora, origen, estado)
SELECT id_empleado, 'Entrada', TO_TIMESTAMP('2026-08-10 08:00:00','YYYY-MM-DD HH24:MI:SS'), 'QR', 'Activo'
FROM EMPLEADO WHERE correo = 'carlos@empresa.com';

INSERT INTO ASISTENCIA (id_empleado, tipo, fecha_hora, origen, estado)
SELECT id_empleado, 'Salida', TO_TIMESTAMP('2026-08-10 17:00:00','YYYY-MM-DD HH24:MI:SS'), 'QR', 'Activo'
FROM EMPLEADO WHERE correo = 'carlos@empresa.com';

INSERT INTO ASISTENCIA (id_empleado, tipo, fecha_hora, origen, estado)
SELECT id_empleado, 'Entrada', TO_TIMESTAMP('2026-08-11 08:05:00','YYYY-MM-DD HH24:MI:SS'), 'QR', 'Activo'
FROM EMPLEADO WHERE correo = 'carlos@empresa.com';

INSERT INTO ASISTENCIA (id_empleado, tipo, fecha_hora, origen, estado)
SELECT id_empleado, 'Salida', TO_TIMESTAMP('2026-08-11 17:10:00','YYYY-MM-DD HH24:MI:SS'), 'QR', 'Activo'
FROM EMPLEADO WHERE correo = 'carlos@empresa.com';


-- -------------------- Horas extra de ejemplo (periodo 2026-08) --------------------
INSERT INTO HORA_EXTRA (id_empleado, fecha, tipo, cantidad_horas, valor_hora_base, factor_recargo, valor)
SELECT id_empleado, TO_DATE('2026-08-10','YYYY-MM-DD'), 'Diurna', 2, 6250, 1.25, 15625
FROM EMPLEADO WHERE correo = 'carlos@empresa.com';

INSERT INTO HORA_EXTRA (id_empleado, fecha, tipo, cantidad_horas, valor_hora_base, factor_recargo, valor)
SELECT id_empleado, TO_DATE('2026-08-11','YYYY-MM-DD'), 'Nocturna', 1.5, 6250, 1.75, 16406.25
FROM EMPLEADO WHERE correo = 'carlos@empresa.com';

-- Programacion diaria (CU04): semana del 26 de octubre de 2026.
-- Tiene prioridad sobre la plantilla TURNO + ASIGNACION_HORARIO.
INSERT INTO HORARIO_ASIGNADO (id_empleado, fecha, hora_entrada_prog, hora_salida_prog, tipo_turno)
SELECT id_empleado, TO_DATE('2026-10-26','YYYY-MM-DD'), '08:00', '17:00', 'Diurno'
FROM EMPLEADO WHERE correo = 'carlos@empresa.com';

INSERT INTO HORARIO_ASIGNADO (id_empleado, fecha, hora_entrada_prog, hora_salida_prog, tipo_turno)
SELECT id_empleado, TO_DATE('2026-10-27','YYYY-MM-DD'), '14:00', '22:00', 'Vespertino'
FROM EMPLEADO WHERE correo = 'carlos@empresa.com';

INSERT INTO HORARIO_ASIGNADO (id_empleado, fecha, hora_entrada_prog, hora_salida_prog, tipo_turno)
SELECT id_empleado, TO_DATE('2026-10-28','YYYY-MM-DD'), '22:00', '06:00', 'Nocturno'
FROM EMPLEADO WHERE correo = 'maria@empresa.com';

COMMIT;

-- ============================================================
-- Borra TODAS las tablas del proyecto (ordem inverso a las claves foraneas).
-- Pensado para desarrollo: reinicia la base para volver a correr el esquema.
--   node scripts/db.js reiniciar
--
-- Si una tabla no existe, el error se ignora.
-- ============================================================

DROP TABLE CONTACTO_EMERGENCIA CASCADE CONSTRAINTS PURGE;
DROP TABLE ASISTENCIA CASCADE CONSTRAINTS PURGE;
DROP TABLE HORA_EXTRA CASCADE CONSTRAINTS PURGE;
DROP TABLE NOMINA CASCADE CONSTRAINTS PURGE;
DROP TABLE ASIGNACION_HORARIO CASCADE CONSTRAINTS PURGE;
DROP TABLE TURNO CASCADE CONSTRAINTS PURGE;
DROP TABLE RECUPERACION_CONTRASENA CASCADE CONSTRAINTS PURGE;
DROP TABLE EMPLEADO CASCADE CONSTRAINTS PURGE;

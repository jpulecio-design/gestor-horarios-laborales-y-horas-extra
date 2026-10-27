-- Migración: Agregar flujo de aprobación a HORAS_EXTRA
-- Ejecutar una vez sobre la BD existente

ALTER TABLE HORA_EXTRA ADD (
    estado_aprobacion    VARCHAR2(15) DEFAULT 'Pendiente' NOT NULL,
    aprobado_por         NUMBER,
    fecha_aprobacion     TIMESTAMP,
    observacion_aprobacion VARCHAR2(200),
    CONSTRAINT fk_hora_extra_aprobado_por FOREIGN KEY (aprobado_por) REFERENCES EMPLEADO (id_empleado),
    CONSTRAINT ck_hora_extra_estado_aprob CHECK (estado_aprobacion IN ('Pendiente', 'Aprobado', 'Rechazado'))
);

-- Actualizar registros existentes (si los hay sin estado_aprobacion por alguna razón)
UPDATE HORA_EXTRA SET estado_aprobacion = 'Aprobado' WHERE estado_aprobacion IS NULL;

COMMIT;
CREATE INDEX ix_hora_extra_estado_aprob ON HORA_EXTRA (estado_aprobacion);

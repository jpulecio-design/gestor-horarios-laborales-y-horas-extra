CREATE TABLE BACKUP_HISTORIAL (
    id_backup      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha_hora     DATE DEFAULT SYSDATE NOT NULL,
    nombre_archivo VARCHAR2(150),
    tipo           VARCHAR2(15) NOT NULL,
    estado         VARCHAR2(15) NOT NULL,
    id_empleado    NUMBER,
    intentos       NUMBER DEFAULT 1 NOT NULL,
    tamano_bytes   NUMBER,
    detalle_error  VARCHAR2(255),
    CONSTRAINT ck_backup_tipo   CHECK (tipo IN ('Manual','Automatico')),
    CONSTRAINT ck_backup_estado CHECK (estado IN ('Exitoso','Fallido')),
    CONSTRAINT fk_backup_empleado FOREIGN KEY (id_empleado) REFERENCES EMPLEADO(id_empleado)
);

import { peticion } from './cliente';

export type Rol = 'Empleado' | 'Administrador' | 'Contadora';

export type UsuarioSesion = {
  id: number;
  username: string;
  rol: Rol;
};

export type Perfil = {
  id: number;
  nombre: string | null;
  apellido: string | null;
  correo: string;
  telefono: string | null;
  rol: Rol;
  estado: string;
  cargo: string | null;
  fechaIngreso: string | null;
};

export type Turno = {
  id: number | null;
  nombre: string;
  tipoTurno?: string;
  horaEntrada: string;
  horaSalida: string;
  origen: 'Plantilla' | 'Programación';
};

export type DiaSemana = {
  fecha: string;
  dia: string;
  diaIso: number;
  turno: Turno | null;
};

type RespuestaLogin = {
  exito: boolean;
  mensaje?: string;
  token?: string;
  usuario?: UsuarioSesion;
};

export function iniciarSesion(username: string, password: string) {
  return peticion<RespuestaLogin>('/auth/login', {
    method: 'POST',
    body: { username, password },
  });
}

export function obtenerPerfil(token: string) {
  return peticion<{ exito: boolean; usuario: Perfil }>('/auth/me', { token });
}

export function obtenerTurnoHoy(token: string, empleadoId: number) {
  return peticion<{ empleadoId: number; fecha: string; turno: Turno | null }>(
    `/horarios/empleado/${empleadoId}/hoy`,
    { token },
  );
}

export function obtenerSemana(token: string, empleadoId: number) {
  return peticion<{ empleadoId: number; inicio: string; dias: DiaSemana[] }>(
    `/horarios/empleado/${empleadoId}/semana`,
    { token },
  );
}

import { API_BASE_URL, TIEMPO_ESPERA_MS } from '../config';

export class ApiError extends Error {
  readonly status: number;

  constructor(mensaje: string, status = 0) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class SesionExpiradaError extends ApiError {
  constructor() {
    super('Tu sesión expiró. Inicia sesión de nuevo.', 401);
    this.name = 'SesionExpiradaError';
  }
}

type OpcionesPeticion = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  timeoutMs?: number;
};

function extraerMensaje(datos: unknown): string | null {
  if (datos && typeof datos === 'object') {
    const objeto = datos as Record<string, unknown>;
    const candidato = objeto.error ?? objeto.mensaje;
    if (typeof candidato === 'string' && candidato.trim().length > 0) {
      return candidato;
    }
  }
  return null;
}

export async function peticion<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const controlador = new AbortController();
  const temporizador = setTimeout(
    () => controlador.abort(),
    opciones.timeoutMs ?? TIEMPO_ESPERA_MS,
  );

  try {
    const respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
      method: opciones.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(opciones.token ? { Authorization: `Bearer ${opciones.token}` } : {}),
      },
      body: opciones.body === undefined ? undefined : JSON.stringify(opciones.body),
      signal: controlador.signal,
    });

    const texto = await respuesta.text();
    let datos: unknown = null;
    if (texto.length > 0) {
      try {
        datos = JSON.parse(texto);
      } catch {
        datos = texto;
      }
    }

    if (!respuesta.ok) {
      if (respuesta.status === 401) {
        throw new SesionExpiradaError();
      }
      throw new ApiError(
        extraerMensaje(datos) ?? 'No se pudo completar la solicitud.',
        respuesta.status,
      );
    }

    return datos as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('El servidor tardó demasiado en responder. Revisa tu conexión.');
    }
    throw new ApiError(
      'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
    );
  } finally {
    clearTimeout(temporizador);
  }
}

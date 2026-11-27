import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  iniciarSesion as iniciarSesionApi,
  obtenerPerfil,
  type Perfil,
  type Rol,
} from '../api/endpoints';
import { SesionExpiradaError } from '../api/cliente';
import { borrarSesion, guardarSesion, leerSesion } from './storage';

type ValorAuth = {
  usuario: Perfil | null;
  token: string | null;
  cargando: boolean;
  iniciarSesion: (username: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  tieneRol: (...roles: Rol[]) => boolean;
};

const AuthContext = createContext<ValorAuth | null>(null);

function perfilDesdeSesion(sesion: unknown): Perfil | null {
  if (!sesion || typeof sesion !== 'object') {
    return null;
  }
  const datos = sesion as Record<string, unknown>;
  if (typeof datos.id !== 'number' || typeof datos.rol !== 'string') {
    return null;
  }
  return {
    id: datos.id,
    nombre: typeof datos.nombre === 'string' ? datos.nombre : null,
    apellido: typeof datos.apellido === 'string' ? datos.apellido : null,
    correo:
      typeof datos.correo === 'string'
        ? datos.correo
        : typeof datos.username === 'string'
          ? datos.username
          : '',
    telefono: typeof datos.telefono === 'string' ? datos.telefono : null,
    rol: datos.rol as Rol,
    estado: typeof datos.estado === 'string' ? datos.estado : 'Activo',
    cargo: typeof datos.cargo === 'string' ? datos.cargo : null,
    fechaIngreso: typeof datos.fechaIngreso === 'string' ? datos.fechaIngreso : null,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [usuario, setUsuario] = useState<Perfil | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    async function restaurarSesion() {
      try {
        const sesion = await leerSesion();
        if (!sesion || !activo) {
          return;
        }

        setToken(sesion.token);
        setUsuario(perfilDesdeSesion(sesion.usuario));

        try {
          const actualizado = await obtenerPerfil(sesion.token);
          if (!activo) {
            return;
          }
          if (actualizado?.usuario) {
            setUsuario(actualizado.usuario);
            await guardarSesion(sesion.token, actualizado.usuario);
          }
        } catch (error) {
          if (error instanceof SesionExpiradaError) {
            await borrarSesion();
            if (activo) {
              setToken(null);
              setUsuario(null);
            }
          }
        }
      } catch {
        if (activo) {
          setToken(null);
          setUsuario(null);
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    void restaurarSesion();

    return () => {
      activo = false;
    };
  }, []);

  const iniciarSesion = useCallback(async (username: string, password: string) => {
    const resultado = await iniciarSesionApi(username, password);

    if (!resultado.exito || !resultado.token || !resultado.usuario) {
      throw new Error(resultado.mensaje || 'Usuario o contraseña incorrectos.');
    }

    let perfil: Perfil = perfilDesdeSesion(resultado.usuario) ?? {
      id: resultado.usuario.id,
      nombre: null,
      apellido: null,
      correo: resultado.usuario.username,
      telefono: null,
      rol: resultado.usuario.rol,
      estado: 'Activo',
      cargo: null,
      fechaIngreso: null,
    };

    try {
      const detalle = await obtenerPerfil(resultado.token);
      if (detalle?.usuario) {
        perfil = detalle.usuario;
      }
    } catch {
      // Si /me falla se continúa con los datos básicos del login.
    }

    setToken(resultado.token);
    setUsuario(perfil);
    await guardarSesion(resultado.token, perfil);
  }, []);

  const cerrarSesion = useCallback(async () => {
    setToken(null);
    setUsuario(null);
    await borrarSesion();
  }, []);

  const tieneRol = useCallback(
    (...roles: Rol[]) => {
      if (!usuario) {
        return false;
      }
      return roles.includes(usuario.rol);
    },
    [usuario],
  );

  const valor = useMemo<ValorAuth>(
    () => ({ usuario, token, cargando, iniciarSesion, cerrarSesion, tieneRol }),
    [usuario, token, cargando, iniciarSesion, cerrarSesion, tieneRol],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): ValorAuth {
  const valor = useContext(AuthContext);
  if (!valor) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider.');
  }
  return valor;
}

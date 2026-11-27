import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CLAVE_TOKEN = 'turno_smart_token';
const CLAVE_USUARIO = 'turno_smart_usuario';

type AlmacenWeb = {
  getItem(clave: string): string | null;
  setItem(clave: string, valor: string): void;
  removeItem(clave: string): void;
};

function almacenWeb(): AlmacenWeb | undefined {
  return (globalThis as unknown as { localStorage?: AlmacenWeb }).localStorage;
}

async function guardar(clave: string, valor: string): Promise<void> {
  if (Platform.OS === 'web') {
    almacenWeb()?.setItem(clave, valor);
    return;
  }
  await SecureStore.setItemAsync(clave, valor);
}

async function leer(clave: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return almacenWeb()?.getItem(clave) ?? null;
  }
  return SecureStore.getItemAsync(clave);
}

async function borrar(clave: string): Promise<void> {
  if (Platform.OS === 'web') {
    almacenWeb()?.removeItem(clave);
    return;
  }
  await SecureStore.deleteItemAsync(clave);
}

export type SesionGuardada = {
  token: string;
  usuario: unknown;
};

export async function guardarSesion(token: string, usuario: unknown): Promise<void> {
  await guardar(CLAVE_TOKEN, token);
  await guardar(CLAVE_USUARIO, JSON.stringify(usuario));
}

export async function leerSesion(): Promise<SesionGuardada | null> {
  const token = await leer(CLAVE_TOKEN);
  const usuarioCrudo = await leer(CLAVE_USUARIO);
  if (!token || !usuarioCrudo) {
    return null;
  }
  try {
    return { token, usuario: JSON.parse(usuarioCrudo) };
  } catch {
    await borrarSesion();
    return null;
  }
}

export async function borrarSesion(): Promise<void> {
  await borrar(CLAVE_TOKEN);
  await borrar(CLAVE_USUARIO);
}

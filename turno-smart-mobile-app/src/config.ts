const URL_POR_DEFECTO = 'http://localhost:3000/api';

function normalizarUrlBase(valor: string): string {
  const limpia = valor.trim().replace(/\/+$/, '');
  if (limpia.length === 0) {
    return URL_POR_DEFECTO;
  }
  if (!/\/api$/i.test(limpia)) {
    return `${limpia}/api`;
  }
  return limpia;
}

export const API_BASE_URL = normalizarUrlBase(process.env.EXPO_PUBLIC_API_URL ?? '');

export const TIEMPO_ESPERA_MS = 15000;

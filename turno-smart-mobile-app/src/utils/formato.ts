const MESES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

export function formatearFecha(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  if (!anio || !mes || !dia) {
    return iso;
  }
  return `${dia} ${MESES[mes - 1] ?? ''} ${anio}`;
}

export function nombreCompleto(perfil: {
  nombre?: string | null;
  apellido?: string | null;
  correo?: string | null;
} | null): string {
  if (!perfil) {
    return '';
  }
  const nombre = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ').trim();
  return nombre || perfil.correo || '';
}

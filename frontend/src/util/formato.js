const moneda = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 2,
})

const numero = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 2,
})

export function formatearMoneda(valor) {
  const n = Number(valor)
  if (Number.isNaN(n)) return '-'
  return moneda.format(n)
}

export function formatearNumero(valor) {
  const n = Number(valor)
  if (Number.isNaN(n)) return '-'
  return numero.format(n)
}

export function nombreCompleto(empleado) {
  if (!empleado) return '-'
  const u = empleado.usuario || empleado
  return [u.nombre, u.apellido].filter(Boolean).join(' ') || '-'
}

export const NOMBRES_DIA = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]

export function aTexto(input) {
  const fecha = input instanceof Date ? input : new Date(input)
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function primerDiaDelMes() {
  const hoy = new Date()
  return aTexto(new Date(hoy.getFullYear(), hoy.getMonth(), 1))
}

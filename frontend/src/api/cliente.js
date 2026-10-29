import axios from 'axios'

const cliente = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

cliente.interceptors.request.use((configuracion) => {
  const token = localStorage.getItem('token')
  if (token) {
    configuracion.headers.Authorization = `Bearer ${token}`
  }
  return configuracion
})

cliente.interceptors.response.use(
  (respuesta) => respuesta,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }

    // En las descargas (responseType: 'blob') el error JSON llega como Blob.
    let datos = error.response?.data
    if (datos instanceof Blob) {
      try {
        datos = JSON.parse(await datos.text())
      } catch {
        datos = null
      }
    }

    const mensaje =
      datos?.error ||
      datos?.mensaje ||
      error.message ||
      'Error de conexión con el servidor'
    return Promise.reject(new Error(mensaje))
  },
)

export default cliente
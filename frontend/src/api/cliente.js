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
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }

    const mensaje =
      error.response?.data?.error ||
      error.response?.data?.mensaje ||
      error.message ||
      'Error de conexión con el servidor'
    return Promise.reject(new Error(mensaje))
  },
)

export default cliente
import { useState } from 'react'
import { apiReportes } from '../api'
import { useAuth } from '../context/useAuth'
import { Alerta, Tarjeta } from '../components/Comunes'
import PanelBackups from '../components/PanelBackups'
import { guardarBlob } from '../util/descargas'
import { aTexto, primerDiaDelMes } from '../util/formato'

function Reportes() {
  const { tieneRol } = useAuth()
  const [desde, setDesde] = useState(primerDiaDelMes())
  const [hasta, setHasta] = useState(aTexto(new Date()))
  const [mensaje, setMensaje] = useState(null)

  async function descargar() {
    setMensaje(null)
    if (!desde || !hasta) {
      setMensaje({ tipo: 'error', texto: 'Selecciona ambas fechas.' })
      return
    }
    if (hasta < desde) {
      setMensaje({ tipo: 'error', texto: 'La fecha hasta no puede ser anterior a la desde.' })
      return
    }
    try {
      const blob = await apiReportes.monitoreoXlsx({ desde, hasta })
      guardarBlob(blob, `reporte-${desde}_a_${hasta}.xlsx`)
      setMensaje({ tipo: 'exito', texto: 'Descarga iniciada.' })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  return (
    <div>
      <h1>Reportes</h1>

      {mensaje && <Alerta tipo={mensaje.tipo}>{mensaje.texto}</Alerta>}

      <Tarjeta titulo="Reporte de monitoreo (.xlsx)">
        <p>
          Genera un libro de Excel con tres hojas: <strong>Resumen</strong>,{' '}
          <strong>Horas extra</strong> y <strong>Asistencia</strong>.
        </p>
        <div className="filtros">
          <label className="campo">
            Desde
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </label>
          <label className="campo">
            Hasta
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </label>
          <button type="button" onClick={descargar}>
            Descargar Excel
          </button>
        </div>
      </Tarjeta>

      {/* Las copias de seguridad (CU11) solo las gestiona el Administrador. */}
      {tieneRol('Administrador') && <PanelBackups />}
    </div>
  )
}

export default Reportes

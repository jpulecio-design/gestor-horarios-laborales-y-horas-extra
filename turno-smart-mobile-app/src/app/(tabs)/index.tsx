import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SesionExpiradaError } from '../../api/cliente';
import {
  obtenerSemana,
  obtenerTurnoHoy,
  type DiaSemana,
  type Turno,
} from '../../api/endpoints';
import { useAuth } from '../../auth/AuthContext';
import { colores, radios, espacios } from '../../theme';
import { formatearFecha, nombreCompleto } from '../../utils/formato';

type TurnoHoy = {
  fecha: string;
  turno: Turno | null;
};

type DatosHorario = {
  hoy: TurnoHoy;
  semana: DiaSemana[];
};

async function consultarHorario(token: string, empleadoId: number): Promise<DatosHorario> {
  const [respuestaHoy, respuestaSemana] = await Promise.all([
    obtenerTurnoHoy(token, empleadoId),
    obtenerSemana(token, empleadoId),
  ]);

  return {
    hoy: { fecha: respuestaHoy.fecha, turno: respuestaHoy.turno },
    semana: respuestaSemana.dias,
  };
}

export default function Inicio() {
  const { usuario, token, cerrarSesion } = useAuth();
  const [hoy, setHoy] = useState<TurnoHoy | null>(null);
  const [semana, setSemana] = useState<DiaSemana[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const recargar = useCallback(async () => {
    if (!token || !usuario) {
      return;
    }

    setCargando(true);
    setError('');

    try {
      const datos = await consultarHorario(token, usuario.id);
      setHoy(datos.hoy);
      setSemana(datos.semana);
    } catch (e) {
      if (e instanceof SesionExpiradaError) {
        await cerrarSesion();
        return;
      }
      setError(e instanceof Error ? e.message : 'No se pudo cargar tu información.');
    } finally {
      setCargando(false);
    }
  }, [cerrarSesion, token, usuario]);

  useEffect(() => {
    let activo = true;

    async function cargarInicial() {
      if (!token || !usuario) {
        return;
      }

      try {
        const datos = await consultarHorario(token, usuario.id);
        if (!activo) {
          return;
        }
        setHoy(datos.hoy);
        setSemana(datos.semana);
        setError('');
      } catch (e) {
        if (!activo) {
          return;
        }
        if (e instanceof SesionExpiradaError) {
          await cerrarSesion();
          return;
        }
        setError(e instanceof Error ? e.message : 'No se pudo cargar tu información.');
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    void cargarInicial();

    return () => {
      activo = false;
    };
  }, [cerrarSesion, token, usuario]);

  const primeraCarga = cargando && hoy === null && semana.length === 0;

  return (
    <SafeAreaView style={styles.pantalla} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        refreshControl={
          <RefreshControl
            refreshing={cargando && !primeraCarga}
            onRefresh={recargar}
            tintColor={colores.primario}
            colors={[colores.primario]}
          />
        }
      >
        <View style={styles.encabezado}>
          <View style={styles.saludoBloque}>
            <Text style={styles.saludo}>Hola,</Text>
            <Text style={styles.nombre}>{nombreCompleto(usuario)}</Text>
          </View>
          {usuario ? (
            <View style={styles.rolChip}>
              <Text style={styles.rolTexto}>{usuario.rol}</Text>
            </View>
          ) : null}
        </View>

        {error ? (
          <View style={styles.errorCaja}>
            <Text style={styles.errorTexto}>{error}</Text>
            <Pressable
              style={styles.reintentar}
              onPress={recargar}
              accessibilityRole="button"
              accessibilityLabel="Reintentar"
            >
              <Text style={styles.reintentarTexto}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {primeraCarga ? (
          <View style={styles.cargandoCaja}>
            <ActivityIndicator size="large" color={colores.primario} />
            <Text style={styles.cargandoTexto}>Cargando tu horario...</Text>
          </View>
        ) : (
          <>
            <View style={styles.tarjeta}>
              <Text style={styles.tituloTarjeta}>Turno de hoy</Text>
              {hoy?.turno ? (
                <View>
                  <Text style={styles.turnoNombre}>{hoy.turno.nombre}</Text>
                  <Text style={styles.turnoHoras}>
                    {hoy.turno.horaEntrada} - {hoy.turno.horaSalida}
                  </Text>
                  <Text style={styles.turnoOrigen}>Origen: {hoy.turno.origen}</Text>
                </View>
              ) : (
                <Text style={styles.textoVacio}>Hoy no tienes turno asignado.</Text>
              )}
            </View>

            <View style={styles.tarjeta}>
              <Text style={styles.tituloTarjeta}>Esta semana</Text>
              {semana.length === 0 ? (
                <Text style={styles.textoVacio}>No hay horarios para mostrar.</Text>
              ) : (
                semana.map((dia) => {
                  const esHoy = hoy?.fecha === dia.fecha;
                  return (
                    <View
                      key={dia.fecha}
                      style={[styles.filaDia, esHoy && styles.filaDiaHoy]}
                    >
                      <View>
                        <Text style={[styles.diaNombre, esHoy && styles.textoHoy]}>
                          {dia.dia}
                        </Text>
                        <Text style={styles.diaFecha}>{formatearFecha(dia.fecha)}</Text>
                      </View>
                      {dia.turno ? (
                        <Text style={styles.diaTurno}>
                          {dia.turno.horaEntrada} - {dia.turno.horaSalida}
                        </Text>
                      ) : (
                        <Text style={styles.diaLibre}>Libre</Text>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}

        <Pressable
          style={({ pressed }) => [styles.salir, pressed && styles.salirPresionado]}
          onPress={cerrarSesion}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
        >
          <Text style={styles.salirTexto}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  contenido: {
    padding: espacios.lg,
    paddingBottom: espacios.xl,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: espacios.lg,
  },
  saludoBloque: {
    flex: 1,
    paddingRight: espacios.md,
  },
  saludo: {
    fontSize: 15,
    color: colores.textoSecundario,
  },
  nombre: {
    fontSize: 24,
    fontWeight: '800',
    color: colores.texto,
  },
  rolChip: {
    backgroundColor: colores.neutroFondo,
    borderRadius: radios.lg,
    paddingHorizontal: espacios.md,
    paddingVertical: espacios.xs,
  },
  rolTexto: {
    color: colores.primarioOscuro,
    fontSize: 12,
    fontWeight: '700',
  },
  errorCaja: {
    backgroundColor: colores.errorFondo,
    borderRadius: radios.md,
    padding: espacios.md,
    marginBottom: espacios.lg,
  },
  errorTexto: {
    color: colores.error,
    fontSize: 14,
    marginBottom: espacios.sm,
  },
  reintentar: {
    alignSelf: 'flex-start',
    backgroundColor: colores.error,
    borderRadius: radios.sm,
    paddingHorizontal: espacios.md,
    paddingVertical: espacios.xs,
  },
  reintentarTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cargandoCaja: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: espacios.xl,
  },
  cargandoTexto: {
    marginTop: espacios.md,
    color: colores.textoSecundario,
    fontSize: 14,
  },
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.lg,
    padding: espacios.lg,
    borderWidth: 1,
    borderColor: colores.borde,
    marginBottom: espacios.lg,
  },
  tituloTarjeta: {
    fontSize: 13,
    fontWeight: '800',
    color: colores.textoSecundario,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: espacios.md,
  },
  turnoNombre: {
    fontSize: 22,
    fontWeight: '800',
    color: colores.texto,
  },
  turnoHoras: {
    marginTop: espacios.xs,
    fontSize: 18,
    fontWeight: '700',
    color: colores.primario,
  },
  turnoOrigen: {
    marginTop: espacios.xs,
    fontSize: 13,
    color: colores.textoSecundario,
  },
  textoVacio: {
    fontSize: 15,
    color: colores.textoSecundario,
  },
  filaDia: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: espacios.md,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
  },
  filaDiaHoy: {
    backgroundColor: colores.neutroFondo,
    borderRadius: radios.sm,
    paddingHorizontal: espacios.sm,
  },
  diaNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: colores.texto,
  },
  textoHoy: {
    color: colores.primarioOscuro,
  },
  diaFecha: {
    fontSize: 12,
    color: colores.textoSecundario,
    marginTop: 2,
  },
  diaTurno: {
    fontSize: 15,
    fontWeight: '700',
    color: colores.exito,
  },
  diaLibre: {
    fontSize: 14,
    color: colores.textoSecundario,
  },
  salir: {
    borderWidth: 1,
    borderColor: colores.error,
    borderRadius: radios.md,
    paddingVertical: espacios.md,
    alignItems: 'center',
    marginTop: espacios.xs,
  },
  salirPresionado: {
    backgroundColor: colores.errorFondo,
  },
  salirTexto: {
    color: colores.error,
    fontSize: 15,
    fontWeight: '700',
  },
});

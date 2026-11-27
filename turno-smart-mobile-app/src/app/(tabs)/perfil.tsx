import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../auth/AuthContext';
import { colores, radios, espacios } from '../../theme';
import { formatearFecha, nombreCompleto } from '../../utils/formato';

function valorTexto(valor: string | null | undefined): string {
  if (valor === null || valor === undefined || valor.trim().length === 0) {
    return '—';
  }
  return valor;
}

export default function Perfil() {
  const { usuario, cerrarSesion } = useAuth();

  if (!usuario) {
    return null;
  }

  const filas: { etiqueta: string; valor: string }[] = [
    { etiqueta: 'Nombre', valor: nombreCompleto(usuario) },
    { etiqueta: 'Correo', valor: usuario.correo },
    { etiqueta: 'Rol', valor: usuario.rol },
    { etiqueta: 'Estado', valor: usuario.estado },
    { etiqueta: 'Cargo', valor: valorTexto(usuario.cargo) },
    { etiqueta: 'Teléfono', valor: valorTexto(usuario.telefono) },
    {
      etiqueta: 'Fecha de ingreso',
      valor: usuario.fechaIngreso ? formatearFecha(usuario.fechaIngreso) : '—',
    },
  ];

  return (
    <SafeAreaView style={styles.pantalla} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={styles.titulo}>Mi perfil</Text>
        <Text style={styles.subtitulo}>
          Tu sesión se conserva al cerrar la aplicación mientras el token siga vigente.
        </Text>

        <View style={styles.tarjeta}>
          {filas.map((fila, indice) => (
            <View
              key={fila.etiqueta}
              style={[styles.fila, indice === filas.length - 1 && styles.ultimaFila]}
            >
              <Text style={styles.etiqueta}>{fila.etiqueta}</Text>
              <Text style={styles.valor}>{fila.valor}</Text>
            </View>
          ))}
        </View>

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
  titulo: {
    fontSize: 26,
    fontWeight: '800',
    color: colores.texto,
  },
  subtitulo: {
    marginTop: espacios.xs,
    marginBottom: espacios.lg,
    fontSize: 13,
    color: colores.textoSecundario,
  },
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: colores.borde,
    paddingHorizontal: espacios.lg,
  },
  fila: {
    paddingVertical: espacios.md,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  ultimaFila: {
    borderBottomWidth: 0,
  },
  etiqueta: {
    fontSize: 12,
    fontWeight: '700',
    color: colores.textoSecundario,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valor: {
    marginTop: espacios.xs,
    fontSize: 16,
    color: colores.texto,
  },
  salir: {
    borderWidth: 1,
    borderColor: colores.error,
    borderRadius: radios.md,
    paddingVertical: espacios.md,
    alignItems: 'center',
    marginTop: espacios.xl,
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

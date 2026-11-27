import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../config';
import { colores, radios, espacios } from '../theme';

export default function Login() {
  const { iniciarSesion } = useAuth();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio() {
    if (enviando) {
      return;
    }

    const usuario = correo.trim();
    if (!usuario || !contrasena) {
      setError('Escribe tu correo y tu contraseña.');
      return;
    }

    setError('');
    setEnviando(true);
    try {
      await iniciarSesion(usuario, contrasena);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={styles.pantalla}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.encabezado}>
            <Text style={styles.titulo}>Turno Smart</Text>
            <Text style={styles.subtitulo}>Gestor de horarios y horas extra</Text>
          </View>

          <View style={styles.tarjeta}>
            <Text style={styles.etiqueta}>Correo</Text>
            <TextInput
              style={styles.entrada}
              value={correo}
              onChangeText={setCorreo}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="username"
              placeholder="tu.correo@empresa.com"
              placeholderTextColor={colores.textoSecundario}
              editable={!enviando}
            />

            <Text style={styles.etiqueta}>Contraseña</Text>
            <TextInput
              style={styles.entrada}
              value={contrasena}
              onChangeText={setContrasena}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              placeholder="Tu contraseña"
              placeholderTextColor={colores.textoSecundario}
              editable={!enviando}
              onSubmitEditing={manejarEnvio}
              returnKeyType="go"
            />

            {error ? (
              <View style={styles.errorCaja}>
                <Text style={styles.errorTexto}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.boton,
                (pressed || enviando) && styles.botonPresionado,
              ]}
              onPress={manejarEnvio}
              disabled={enviando}
              accessibilityRole="button"
              accessibilityLabel="Iniciar sesión"
            >
              <Text style={styles.botonTexto}>{enviando ? 'Ingresando...' : 'Iniciar sesión'}</Text>
            </Pressable>

            {__DEV__ ? <Text style={styles.servidor}>Servidor: {API_BASE_URL}</Text> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  flex: {
    flex: 1,
  },
  contenido: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: espacios.xl,
  },
  encabezado: {
    marginBottom: espacios.xl,
  },
  titulo: {
    fontSize: 32,
    fontWeight: '800',
    color: colores.texto,
  },
  subtitulo: {
    marginTop: espacios.xs,
    fontSize: 15,
    color: colores.textoSecundario,
  },
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.lg,
    padding: espacios.xl,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '700',
    color: colores.textoSecundario,
    marginBottom: espacios.xs,
  },
  entrada: {
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radios.md,
    paddingHorizontal: espacios.md,
    paddingVertical: espacios.md,
    fontSize: 16,
    color: colores.texto,
    backgroundColor: '#FAFBFF',
    marginBottom: espacios.lg,
  },
  errorCaja: {
    backgroundColor: colores.errorFondo,
    borderRadius: radios.sm,
    padding: espacios.md,
    marginBottom: espacios.md,
  },
  errorTexto: {
    color: colores.error,
    fontSize: 14,
  },
  boton: {
    backgroundColor: colores.primario,
    borderRadius: radios.md,
    paddingVertical: espacios.lg,
    alignItems: 'center',
  },
  botonPresionado: {
    backgroundColor: colores.primarioOscuro,
  },
  botonTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  servidor: {
    marginTop: espacios.lg,
    fontSize: 11,
    color: colores.textoSecundario,
    textAlign: 'center',
  },
});

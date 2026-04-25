// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { auth, db } from "../services/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { globalStyles, COLORS, SPACING } from "../theme/theme";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [facultad, setFacultad] = useState("");

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.endsWith("@unsa.edu.pe")) {
      Alert.alert(
        "Acceso Denegado",
        "Usa tu correo institucional @unsa.edu.pe",
      );
      return;
    }

    if (!isLogin && (!nombre || !whatsapp || !facultad)) {
      Alert.alert(
        "Campos incompletos",
        "Para registrarte, todos los datos del perfil son obligatorios.",
      );
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password,
        );

        // Guardamos el perfil completo inmediatamente
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: cleanEmail,
          nombre: nombre.trim(),
          whatsapp: whatsapp.trim(),
          facultad: facultad.trim(),
          rating_promedio: 0,
          total_ventas: 0,
          fecha_registro: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        contentContainerStyle={[
          globalStyles.containerPadding,
          { justifyContent: "center" },
        ]}
      >
        <View style={{ alignItems: "center", marginBottom: SPACING.xl }}>
          <Ionicons name="cart" size={60} color={COLORS.primary} />
          <Text style={[globalStyles.title, { marginBottom: 0 }]}>
            UNSA Market
          </Text>
          <Text style={{ color: COLORS.textMuted }}>
            Comunidad Universitaria Conectada
          </Text>
        </View>

        <Text style={globalStyles.label}>Correo Institucional</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="ejemplo@unsa.edu.pe"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {!isLogin && (
          <>
            <Text style={globalStyles.label}>Nombre Completo</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="Nombres y Apellidos"
              value={nombre}
              onChangeText={setNombre}
            />

            <Text style={globalStyles.label}>WhatsApp</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="987654321"
              value={whatsapp}
              onChangeText={setWhatsapp}
              keyboardType="phone-pad"
            />

            <Text style={globalStyles.label}>Facultad</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="Ej. Ing. de Sistemas"
              value={facultad}
              onChangeText={setFacultad}
            />
          </>
        )}

        <Text style={globalStyles.label}>Contraseña</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={globalStyles.primaryButton}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={globalStyles.primaryButtonText}>
              {isLogin ? "Ingresar" : "Crear Cuenta"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsLogin(!isLogin)}
          style={{ marginTop: SPACING.lg }}
        >
          <Text
            style={{
              textAlign: "center",
              color: COLORS.primary,
              fontWeight: "bold",
            }}
          >
            {isLogin
              ? "¿No tienes cuenta? Regístrate aquí"
              : "¿Ya tienes cuenta? Inicia sesión"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

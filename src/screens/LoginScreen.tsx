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
} from "react-native";
import { auth, db } from "../services/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { globalStyles, COLORS, SPACING } from "../theme/theme"; // <-- Importamos el tema

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim().toLowerCase().endsWith("@unsa.edu.pe")) {
      Alert.alert(
        "Acceso Denegado",
        "Solo se permiten correos institucionales de la UNSA (@unsa.edu.pe).",
      );
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: email.trim().toLowerCase(),
          nombre: "",
          facultad: "",
          whatsapp: "",
          rating_promedio: 0,
          total_ventas: 0,
        });
      }
    } catch (error: any) {
      Alert.alert("Error de Autenticación", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View
        style={[globalStyles.containerPadding, { justifyContent: "center" }]}
      >
        <Text
          style={[
            globalStyles.title,
            { fontSize: 28, marginBottom: SPACING.sm },
          ]}
        >
          UNSA Market & Skills
        </Text>
        <Text style={localStyles.subtitle}>
          {isLogin
            ? "Inicia sesión con tu correo institucional"
            : "Crea tu cuenta universitaria"}
        </Text>

        <TextInput
          style={globalStyles.input}
          placeholder="ejemplo@unsa.edu.pe"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={globalStyles.input}
          placeholder="Contraseña"
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
            <ActivityIndicator color={COLORS.surface} />
          ) : (
            <Text style={globalStyles.primaryButtonText}>
              {isLogin ? "Ingresar" : "Registrarse"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={localStyles.switchText}>
            {isLogin
              ? "¿No tienes cuenta? Regístrate aquí"
              : "¿Ya tienes cuenta? Inicia sesión"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const localStyles = StyleSheet.create({
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: SPACING.xl,
    color: COLORS.textMuted,
  },
  switchText: {
    textAlign: "center",
    marginTop: SPACING.lg,
    color: COLORS.primary,
    fontWeight: "600",
  },
});

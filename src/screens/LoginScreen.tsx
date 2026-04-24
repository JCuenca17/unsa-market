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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    // Barrera de seguridad: Solo correos UNSA
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
        // Iniciar sesión
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        // Registrar nuevo usuario
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );

        // Al registrar, creamos su perfil básico en la base de datos Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: email.trim().toLowerCase(),
          nombre: "", // Se llenará después
          facultad: "", // Se llenará después
          whatsapp: "", // Se llenará después
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
      <View style={styles.container}>
        <Text style={styles.title}>UNSA Market & Skills</Text>
        <Text style={styles.subtitle}>
          {isLogin
            ? "Inicia sesión con tu correo institucional"
            : "Crea tu cuenta universitaria"}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="ejemplo@unsa.edu.pe"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isLogin ? "Ingresar" : "Registrarse"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchText}>
            {isLogin
              ? "¿No tienes cuenta? Regístrate aquí"
              : "¿Ya tienes cuenta? Inicia sesión"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#5A0028",
  }, // Color guinda base
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#5A0028",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  switchText: {
    textAlign: "center",
    marginTop: 20,
    color: "#5A0028",
    fontWeight: "600",
  },
});

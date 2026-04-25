// src/screens/CompleteProfileScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

export default function CompleteProfileScreen() {
  const [whatsapp, setWhatsapp] = useState("");
  const [facultad, setFacultad] = useState("");
  const [loading, setLoading] = useState(false);

  const currentUser = auth.currentUser;

  const handleComplete = async () => {
    if (!whatsapp || !facultad) {
      Alert.alert(
        "Datos Requeridos",
        "Por favor completa ambos campos para asegurar la confianza en la plataforma.",
      );
      return;
    }

    setLoading(true);
    try {
      // Actualizamos los datos faltantes y liberamos el candado
      await updateDoc(doc(db, "users", currentUser!.uid), {
        whatsapp: whatsapp.trim(),
        facultad: facultad.trim(),
        perfil_completado: true, // Al cambiar esto, AppNavigator detecta el cambio y desbloquea la app
      });
    } catch (error: any) {
      Alert.alert("Error", "No se pudo guardar la información.");
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View
        style={[globalStyles.containerPadding, { justifyContent: "center" }]}
      >
        <View style={{ alignItems: "center", marginBottom: SPACING.xl }}>
          <Ionicons name="id-card-outline" size={60} color={COLORS.primary} />
          <Text style={[globalStyles.title, { marginTop: SPACING.md }]}>
            Último Paso
          </Text>
          <Text style={{ color: COLORS.textMuted, textAlign: "center" }}>
            Hola {currentUser?.displayName?.split(" ")[0]}, como es tu primera
            vez en la plataforma, necesitamos un par de datos para que tus
            compañeros puedan contactarte.
          </Text>
        </View>

        <Text style={globalStyles.label}>Número de WhatsApp (Sin +51) *</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Ej. 987654321"
          value={whatsapp}
          onChangeText={setWhatsapp}
          keyboardType="phone-pad"
        />

        <Text style={globalStyles.label}>Facultad / Escuela *</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Ej. Ingeniería de Sistemas"
          value={facultad}
          onChangeText={setFacultad}
        />

        <TouchableOpacity
          style={[globalStyles.primaryButton, { marginTop: SPACING.lg }]}
          onPress={handleComplete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={globalStyles.primaryButtonText}>
              Finalizar Registro
            </Text>
          )}
        </TouchableOpacity>

        {/* Opción para cancelar y salir */}
        <TouchableOpacity
          style={{ marginTop: SPACING.xl, alignItems: "center" }}
          onPress={() => signOut(auth)}
        >
          <Text style={{ color: COLORS.danger, fontWeight: "bold" }}>
            Cancelar y salir
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

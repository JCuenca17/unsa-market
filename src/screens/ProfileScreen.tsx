// src/screens/ProfileScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

export default function ProfileScreen() {
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [facultad, setFacultad] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setNombre(data.nombre || "");
          setWhatsapp(data.whatsapp || "");
          setFacultad(data.facultad || "");
        }
      } catch (error) {
        console.error("Error al obtener perfil:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleUpdate = async () => {
    if (!nombre || !whatsapp) {
      Alert.alert(
        "Campos obligatorios",
        "El nombre y WhatsApp son necesarios.",
      );
      return;
    }
    setUpdating(true);
    try {
      await updateDoc(doc(db, "users", currentUser!.uid), {
        nombre: nombre.trim(),
        whatsapp: whatsapp.trim(),
        facultad: facultad.trim(),
      });
      Alert.alert("Éxito", "Perfil actualizado correctamente.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <View style={globalStyles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView contentContainerStyle={globalStyles.containerPadding}>
        <View style={localStyles.avatarContainer}>
          <View style={localStyles.avatarPlaceholder}>
            <Text style={localStyles.avatarText}>
              {nombre.charAt(0) || "U"}
            </Text>
          </View>
          <Text style={localStyles.emailText}>{currentUser?.email}</Text>
        </View>

        <Text style={globalStyles.label}>Nombre Completo</Text>
        <TextInput
          style={globalStyles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej. Juan Perez"
        />

        <Text style={globalStyles.label}>WhatsApp (Sin el +51)</Text>
        <TextInput
          style={globalStyles.input}
          value={whatsapp}
          onChangeText={setWhatsapp}
          placeholder="987654321"
          keyboardType="phone-pad"
        />

        <Text style={globalStyles.label}>Facultad / Escuela</Text>
        <TextInput
          style={globalStyles.input}
          value={facultad}
          onChangeText={setFacultad}
          placeholder="Ej. Ingeniería de Sistemas"
        />

        <TouchableOpacity
          style={globalStyles.primaryButton}
          onPress={handleUpdate}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color={COLORS.surface} />
          ) : (
            <Text style={globalStyles.primaryButtonText}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={localStyles.logoutButton}
          onPress={() => signOut(auth)}
        >
          <Text style={localStyles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const localStyles = StyleSheet.create({
  avatarContainer: { alignItems: "center", marginBottom: SPACING.xl },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  avatarText: { color: COLORS.surface, fontSize: 32, fontWeight: "bold" },
  emailText: { color: COLORS.textMuted, fontSize: 14 },
  logoutButton: {
    padding: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  logoutButtonText: { color: COLORS.danger, fontWeight: "bold" },
});

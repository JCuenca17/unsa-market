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
        "El nombre y WhatsApp son necesarios para que puedan contactarte.",
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5A0028" />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{nombre.charAt(0) || "U"}</Text>
          </View>
          <Text style={styles.emailText}>{currentUser?.email}</Text>
        </View>

        <Text style={styles.label}>Nombre Completo</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej. Juan Perez"
        />

        <Text style={styles.label}>WhatsApp (Sin el +51)</Text>
        <TextInput
          style={styles.input}
          value={whatsapp}
          onChangeText={setWhatsapp}
          placeholder="987654321"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Facultad / Escuela</Text>
        <TextInput
          style={styles.input}
          value={facultad}
          onChangeText={setFacultad}
          placeholder="Ej. Ingeniería de Sistemas"
        />

        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleUpdate}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.updateButtonText}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => signOut(auth)}
        >
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  avatarContainer: { alignItems: "center", marginBottom: 30 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#5A0028",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "bold" },
  emailText: { color: "#666", fontSize: 14 },
  label: { fontSize: 14, fontWeight: "bold", color: "#333", marginBottom: 5 },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
  },
  updateButton: {
    backgroundColor: "#5A0028",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  updateButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  logoutButton: { padding: 15, alignItems: "center" },
  logoutButtonText: { color: "#d9534f", fontWeight: "bold" },
});

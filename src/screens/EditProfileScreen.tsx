// src/screens/EditProfileScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

export default function EditProfileScreen({ navigation }: any) {
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [facultad, setFacultad] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    // Seguridad adicional: Asegurarnos de que el usuario esté autenticado antes de buscar
    if (!auth.currentUser?.uid) {
      setLoading(false);
      return;
    }

    try {
      const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Usamos ?. por si alguno de los campos aún no existe en la base de datos
        setNombre(data?.nombre || "");
        setWhatsapp(data?.whatsapp || "");
        setFacultad(data?.facultad || "");
        setPhoto(data?.photoURL || null);
      }
    } catch (e) {
      console.error("Error al cargar perfil:", e);
      Alert.alert("Error de conexión", "No pudimos cargar tus datos.");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // 1. Pedir permisos formalmente (Obligatorio en iOS y Android 13+)
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permiso denegado",
          "Necesitamos acceso a tu galería para poder cambiar tu foto de perfil.",
        );
        return;
      }

      // 2. Abrir la galería
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      // 3. Leer la imagen de forma segura (Compatible con Expo viejo y nuevo)
      if (!result.canceled) {
        const imageUri = result.assets
          ? result.assets[0].uri
          : (result as any).uri;
        if (imageUri) {
          setPhoto(imageUri);
        }
      }
    } catch (error) {
      console.error("Error al abrir galería:", error);
      Alert.alert("Error", "No se pudo abrir la galería fotográfica.");
    }
  };

  const handleSave = async () => {
    if (!nombre.trim() || !whatsapp.trim() || !facultad.trim()) {
      Alert.alert(
        "Campos incompletos",
        "Por favor completa todos tus datos personales para continuar.",
      );
      return;
    }

    setSaving(true);
    try {
      // Actualizamos el documento en Firestore
      await updateDoc(doc(db, "users", auth.currentUser!.uid), {
        nombre: nombre.trim(),
        whatsapp: whatsapp.trim(),
        facultad: facultad.trim(),
        photoURL: photo,
        perfil_completado: true, // Aseguramos que el sistema sepa que ya llenó sus datos
      });

      Alert.alert("¡Éxito!", "Tu perfil ha sido actualizado correctamente.");
      navigation.goBack(); // Lo devolvemos a la pantalla de Mi Perfil
    } catch (e) {
      console.error("Error al guardar perfil:", e);
      Alert.alert("Error", "No se pudieron guardar los cambios en la nube.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View
        style={{ flex: 1, justifyContent: "center", backgroundColor: "#fff" }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: "#fff" }}>
      <View
        style={{ alignItems: "center", padding: SPACING.xl, marginTop: 20 }}
      >
        {/* ZONA DE FOTO DE PERFIL */}
        <TouchableOpacity
          onPress={pickImage}
          style={localStyles.imageContainer}
        >
          {photo ? (
            <Image source={{ uri: photo }} style={localStyles.profileImage} />
          ) : (
            <View style={localStyles.placeholder}>
              <Ionicons name="person" size={60} color="#ccc" />
            </View>
          )}
          <View style={localStyles.cameraButton}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text style={{ marginTop: 15, color: COLORS.textMuted, fontSize: 13 }}>
          Toca la imagen para cambiarla
        </Text>

        {/* FORMULARIO */}
        <View style={{ width: "100%", marginTop: SPACING.xl }}>
          <Text style={globalStyles.label}>Nombre Público</Text>
          <TextInput
            style={globalStyles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej. Juan Pérez"
          />

          <Text style={globalStyles.label}>WhatsApp de contacto</Text>
          <TextInput
            style={globalStyles.input}
            value={whatsapp}
            onChangeText={setWhatsapp}
            keyboardType="phone-pad"
            placeholder="Ej. 987654321"
          />

          <Text style={globalStyles.label}>Facultad o Escuela</Text>
          <TextInput
            style={globalStyles.input}
            value={facultad}
            onChangeText={setFacultad}
            placeholder="Ej. Ingeniería de Sistemas"
          />

          <TouchableOpacity
            style={[globalStyles.primaryButton, { marginTop: 20 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={globalStyles.primaryButtonText}>
                Guardar Cambios
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  imageContainer: {
    position: "relative",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  placeholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#f4f4f4",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#eee",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 5,
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: "#fff",
  },
});

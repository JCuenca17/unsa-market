// src/screens/EditProfileScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../services/firebaseConfig";
import { globalStyles, COLORS } from "../theme/theme";

export default function EditProfileScreen({ route, navigation }: any) {
  const { userData } = route.params;
  const [nombre, setNombre] = useState(userData?.nombre || "");
  const [whatsapp, setWhatsapp] = useState(userData?.whatsapp || "");
  const [facultad, setFacultad] = useState(userData?.facultad || "");
  const [updating, setUpdating] = useState(false);

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
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateDoc(doc(db, "users", currentUser.uid), {
          nombre: nombre.trim(),
          whatsapp: whatsapp.trim(),
          facultad: facultad.trim(),
        });
        Alert.alert("Éxito", "Perfil actualizado correctamente.");
        navigation.goBack(); // Regresa al dashboard automáticamente
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView contentContainerStyle={globalStyles.containerPadding}>
        <Text style={globalStyles.title}>Editar Información</Text>

        <Text style={globalStyles.label}>Nombre Completo *</Text>
        <TextInput
          style={globalStyles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej. Juan Perez"
        />

        <Text style={globalStyles.label}>WhatsApp (Sin el +51) *</Text>
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
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

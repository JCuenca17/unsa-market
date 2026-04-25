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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

export default function EditProfileScreen({ navigation }: any) {
  const [userData, setUserData] = useState<any>(null);
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
    try {
      const docSnap = await getDoc(doc(db, "users", auth.currentUser!.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setNombre(data.nombre || "");
        setWhatsapp(data.whatsapp || "");
        setFacultad(data.facultad || "");
        setPhoto(data.photoURL || null);
      }
    } catch (e) {
      Alert.alert("Error", "No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!nombre || !whatsapp || !facultad) {
      Alert.alert(
        "Campos obligatorios",
        "Por favor completa toda tu información.",
      );
      return;
    }

    setSaving(true);
    try {
      // Nota: En una app de producción, aquí subirías la imagen a Firebase Storage.
      // Por ahora, guardaremos la URI local o una URL de placeholder para agilizar.
      await updateDoc(doc(db, "users", auth.currentUser!.uid), {
        nombre,
        whatsapp,
        facultad,
        photoURL: photo, // Guardamos la referencia de la foto
      });
      Alert.alert("Éxito", "Perfil actualizado correctamente.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );

  return (
    <ScrollView style={{ backgroundColor: "#fff" }}>
      <View style={{ alignItems: "center", padding: SPACING.xl }}>
        <TouchableOpacity onPress={pickImage} style={{ position: "relative" }}>
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={{ width: 120, height: 120, borderRadius: 60 }}
            />
          ) : (
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: "#eee",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="person" size={50} color="#ccc" />
            </View>
          )}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              backgroundColor: COLORS.primary,
              padding: 8,
              borderRadius: 20,
            }}
          >
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={{ width: "100%", marginTop: SPACING.xl }}>
          <Text style={globalStyles.label}>Nombre Público</Text>
          <TextInput
            style={globalStyles.input}
            value={nombre}
            onChangeText={setNombre}
          />

          <Text style={globalStyles.label}>WhatsApp de contacto</Text>
          <TextInput
            style={globalStyles.input}
            value={whatsapp}
            onChangeText={setWhatsapp}
            keyboardType="phone-pad"
          />

          <Text style={globalStyles.label}>Facultad</Text>
          <TextInput
            style={globalStyles.input}
            value={facultad}
            onChangeText={setFacultad}
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

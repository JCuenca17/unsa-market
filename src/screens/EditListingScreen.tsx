// src/screens/EditListingScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

export default function EditListingScreen({ route, navigation }: any) {
  const { listing } = route.params;

  const [titulo, setTitulo] = useState(listing.titulo);
  const [precio, setPrecio] = useState(listing.precio.toString());
  const [descripcion, setDescripcion] = useState(listing.descripcion || "");
  const [imagenesBase64, setImagenesBase64] = useState<string[]>(
    listing.imagenes || [],
  );
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    if (imagenesBase64.length >= 5) {
      Alert.alert("Límite alcanzado", "Puedes tener un máximo de 5 fotos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.2,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setImagenesBase64([
        ...imagenesBase64,
        `data:image/jpeg;base64,${result.assets[0].base64}`,
      ]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    const newImages = [...imagenesBase64];
    newImages.splice(indexToRemove, 1);
    setImagenesBase64(newImages);
  };

  const handleUpdate = async () => {
    if (!titulo.trim() || !precio.trim() || imagenesBase64.length === 0) {
      Alert.alert(
        "Campos incompletos",
        "El título, el precio y al menos una foto son obligatorios.",
      );
      return;
    }
    setLoading(true);
    try {
      await updateDoc(doc(db, "listings", listing.id), {
        titulo: titulo.trim(),
        precio: parseFloat(precio),
        descripcion: descripcion.trim(),
        imagenes: imagenesBase64,
      });
      Alert.alert("¡Éxito!", "Tu publicación ha sido actualizada.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "No se pudo actualizar la publicación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={globalStyles.containerPadding}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={globalStyles.label}>
        Fotos ({imagenesBase64.length}/5) *
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={localStyles.imageScroll}
      >
        <TouchableOpacity style={localStyles.addCard} onPress={pickImage}>
          <Ionicons name="camera-outline" size={30} color={COLORS.textLight} />
        </TouchableOpacity>
        {imagenesBase64.map((uri, index) => (
          <View key={index} style={localStyles.imageWrapper}>
            <Image source={{ uri }} style={localStyles.thumbnail} />
            <TouchableOpacity
              style={localStyles.removeBadge}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Text style={globalStyles.label}>Título *</Text>
      <TextInput
        style={globalStyles.input}
        value={titulo}
        onChangeText={setTitulo}
      />

      <Text style={globalStyles.label}>Precio (S/) *</Text>
      <TextInput
        style={globalStyles.input}
        value={precio}
        onChangeText={setPrecio}
        keyboardType="numeric"
      />

      <Text style={globalStyles.label}>Descripción</Text>
      <TextInput
        style={[globalStyles.input, localStyles.textArea]}
        multiline
        numberOfLines={5}
        value={descripcion}
        onChangeText={setDescripcion}
      />

      <TouchableOpacity
        style={[globalStyles.primaryButton, { marginTop: SPACING.lg }]}
        onPress={handleUpdate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={globalStyles.primaryButtonText}>Guardar Cambios</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  imageScroll: { flexDirection: "row", marginBottom: SPACING.lg },
  addCard: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  imageWrapper: { position: "relative", marginRight: SPACING.sm },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  removeBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: COLORS.danger,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    elevation: 2,
  },
  textArea: { height: 120, textAlignVertical: "top" },
});

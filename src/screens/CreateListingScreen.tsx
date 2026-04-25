// src/screens/CreateListingScreen.tsx
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
import { collection, addDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { db, auth } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

const CATEGORIAS = ["Libros", "Tecnología", "Alimentos", "Tutorías", "Otros"];

export default function CreateListingScreen({ navigation }: any) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [tipo, setTipo] = useState<"producto" | "servicio">("producto");
  const [categoria, setCategoria] = useState("");
  const [imagenesBase64, setImagenesBase64] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    if (imagenesBase64.length >= 5) {
      Alert.alert("Límite alcanzado", "Máximo 5 fotos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.2,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64)
      setImagenesBase64([
        ...imagenesBase64,
        `data:image/jpeg;base64,${result.assets[0].base64}`,
      ]);
  };

  const removeImage = (index: number) => {
    const newImages = [...imagenesBase64];
    newImages.splice(index, 1);
    setImagenesBase64(newImages);
  };

  const handlePublish = async () => {
    if (!titulo || !precio || !categoria || imagenesBase64.length === 0) {
      Alert.alert("Error", "Completa campos obligatorios y sube foto.");
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "listings"), {
        vendedor_id: currentUser.uid,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        precio: parseFloat(precio),
        tipo,
        categoria: categoria.trim(),
        estado: "activo",
        imagenes: imagenesBase64,
        fecha_creacion: new Date().toISOString(),
      });
      Alert.alert("Éxito", "Anuncio publicado.");
      setTitulo("");
      setDescripcion("");
      setPrecio("");
      setCategoria("");
      setImagenesBase64([]);
      navigation.navigate("Inicio");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={globalStyles.containerPadding}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <Text style={globalStyles.title}>Publicar en la Tienda</Text>

      <Text style={globalStyles.label}>Fotos ({imagenesBase64.length}/5)</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={localStyles.imageScroll}
      >
        <TouchableOpacity style={localStyles.addCard} onPress={pickImage}>
          <Text style={localStyles.addText}>+</Text>
        </TouchableOpacity>
        {imagenesBase64.map((uri, index) => (
          <View key={index} style={localStyles.imageWrapper}>
            <Image source={{ uri }} style={localStyles.thumbnail} />
            <TouchableOpacity
              style={localStyles.removeBadge}
              onPress={() => removeImage(index)}
            >
              <Text style={localStyles.removeText}>X</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={localStyles.typeContainer}>
        <TouchableOpacity
          style={[
            localStyles.typeButton,
            tipo === "producto" && localStyles.typeButtonActive,
          ]}
          onPress={() => setTipo("producto")}
        >
          <Text
            style={[
              localStyles.typeText,
              tipo === "producto" && localStyles.typeTextActive,
            ]}
          >
            Producto
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            localStyles.typeButton,
            tipo === "servicio" && localStyles.typeButtonActive,
          ]}
          onPress={() => setTipo("servicio")}
        >
          <Text
            style={[
              localStyles.typeText,
              tipo === "servicio" && localStyles.typeTextActive,
            ]}
          >
            Servicio
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={globalStyles.label}>Título *</Text>
      <TextInput
        style={globalStyles.input}
        value={titulo}
        onChangeText={setTitulo}
        placeholder="¿Qué vendes?"
      />

      <Text style={globalStyles.label}>Categoría *</Text>
      <View style={localStyles.categoryGrid}>
        {CATEGORIAS.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              localStyles.categoryChip,
              categoria === cat && localStyles.categoryChipActive,
            ]}
            onPress={() => setCategoria(cat)}
          >
            <Text
              style={[
                localStyles.categoryChipText,
                categoria === cat && localStyles.categoryChipTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={globalStyles.label}>Precio (S/) *</Text>
      <TextInput
        style={globalStyles.input}
        value={precio}
        onChangeText={setPrecio}
        placeholder="0.00"
        keyboardType="numeric"
      />

      <Text style={globalStyles.label}>Descripción</Text>
      <TextInput
        style={[globalStyles.input, localStyles.textArea]}
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Detalles extra..."
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity
        style={globalStyles.primaryButton}
        onPress={handlePublish}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.surface} />
        ) : (
          <Text style={globalStyles.primaryButtonText}>Subir Anuncio</Text>
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
    backgroundColor: COLORS.border,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.sm,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: COLORS.textLight,
  },
  addText: { fontSize: 30, color: COLORS.textMuted },
  imageWrapper: { position: "relative", marginRight: SPACING.sm },
  thumbnail: { width: 80, height: 80, borderRadius: 8 },
  removeBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: COLORS.danger,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  removeText: { color: COLORS.surface, fontSize: 12, fontWeight: "bold" },
  typeContainer: { flexDirection: "row", marginBottom: SPACING.lg },
  typeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: "center",
  },
  typeButtonActive: { backgroundColor: COLORS.primary },
  typeText: { color: COLORS.primary, fontWeight: "bold" },
  typeTextActive: { color: COLORS.surface },
  textArea: { height: 100, textAlignVertical: "top" },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: SPACING.md,
  },
  categoryChip: {
    backgroundColor: "#eee",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryChipActive: { backgroundColor: COLORS.primary },
  categoryChipText: { color: COLORS.textMuted, fontSize: 13 },
  categoryChipTextActive: { color: COLORS.surface, fontWeight: "bold" },
});

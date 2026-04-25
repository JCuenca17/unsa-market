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
} from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

const CATEGORIAS = ["Libros", "Tecnología", "Alimentos", "Tutorías", "Otros"];

export default function EditListingScreen({ route, navigation }: any) {
  const { item } = route.params; // Recibimos el anuncio a editar

  const [titulo, setTitulo] = useState(item.titulo);
  const [descripcion, setDescripcion] = useState(item.descripcion || "");
  const [precio, setPrecio] = useState(item.precio.toString());
  const [tipo, setTipo] = useState<"producto" | "servicio">(item.tipo);
  const [categoria, setCategoria] = useState(item.categoria);
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    if (!titulo || !precio || !categoria) {
      Alert.alert("Error", "Completa los campos obligatorios.");
      return;
    }
    setUpdating(true);
    try {
      await updateDoc(doc(db, "listings", item.id), {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        precio: parseFloat(precio),
        tipo: tipo,
        categoria: categoria.trim(),
      });
      Alert.alert("Éxito", "Anuncio actualizado correctamente.");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={globalStyles.containerPadding}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <Text style={globalStyles.title}>Editar Anuncio</Text>

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
  );
}

const localStyles = StyleSheet.create({
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

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
  Modal,
  FlatList,
} from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

const CATEGORIAS = [
  "Libros",
  "Tecnología",
  "Alimentos",
  "Tutorías",
  "Inmuebles",
  "Servicios",
  "Otros",
];
const TIPOS = ["Producto", "Servicio"];

export default function EditListingScreen({ route, navigation }: any) {
  const { item } = route.params; // Datos del anuncio a editar

  // Inicializamos los estados con los valores actuales del anuncio
  const [titulo, setTitulo] = useState(item.titulo);
  const [descripcion, setDescripcion] = useState(item.descripcion || "");
  const [precio, setPrecio] = useState(item.precio.toString());
  const [tipo, setTipo] = useState(
    item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1),
  ); // Formateo Capitalizado
  const [categoria, setCategoria] = useState(item.categoria);
  const [updating, setUpdating] = useState(false);

  // Estados para controlar los selectores modales
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [typeModalVisible, setTypeModalVisible] = useState(false);

  const handleUpdate = async () => {
    if (!titulo || !precio || !categoria) {
      Alert.alert(
        "Error",
        "Los campos marcados con asterisco (*) son obligatorios.",
      );
      return;
    }

    setUpdating(true);
    try {
      const listingRef = doc(db, "listings", item.id);
      await updateDoc(listingRef, {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        precio: parseFloat(precio),
        tipo: tipo.toLowerCase(),
        categoria: categoria.trim(),
      });

      Alert.alert("Éxito", "El anuncio ha sido actualizado correctamente.");
      navigation.goBack(); // Regresamos a la lista de "Mis Anuncios"
    } catch (error: any) {
      Alert.alert("Error al actualizar", error.message);
    } finally {
      setUpdating(false);
    }
  };

  // Componente de selector profesional
  const SelectorField = ({ label, value, onPress }: any) => (
    <View style={{ marginBottom: SPACING.md }}>
      <Text style={globalStyles.label}>{label} *</Text>
      <TouchableOpacity style={localStyles.selectorInput} onPress={onPress}>
        <Text style={{ color: COLORS.text, fontSize: 16 }}>{value}</Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={globalStyles.containerPadding}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <Text style={globalStyles.title}>Editar Detalles</Text>

      <Text style={globalStyles.label}>Título del Anuncio *</Text>
      <TextInput
        style={globalStyles.input}
        value={titulo}
        onChangeText={setTitulo}
        placeholder="¿Qué estás vendiendo?"
      />

      <SelectorField
        label="Tipo"
        value={tipo}
        onPress={() => setTypeModalVisible(true)}
      />

      <SelectorField
        label="Categoría"
        value={categoria}
        onPress={() => setCategoryModalVisible(true)}
      />

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
        placeholder="Describe el estado del producto, marca, o detalles del servicio..."
        multiline
        numberOfLines={5}
      />

      <TouchableOpacity
        style={[globalStyles.primaryButton, { marginTop: SPACING.lg }]}
        onPress={handleUpdate}
        disabled={updating}
      >
        {updating ? (
          <ActivityIndicator color={COLORS.surface} />
        ) : (
          <Text style={globalStyles.primaryButtonText}>Guardar Cambios</Text>
        )}
      </TouchableOpacity>

      {/* Modal para Seleccionar Tipo */}
      <Modal visible={typeModalVisible} transparent={true} animationType="fade">
        <TouchableOpacity
          style={localStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTypeModalVisible(false)}
        >
          <View style={localStyles.modalContentCenter}>
            <Text style={localStyles.modalTitle}>Tipo de Publicación</Text>
            {TIPOS.map((t) => (
              <TouchableOpacity
                key={t}
                style={localStyles.modalOption}
                onPress={() => {
                  setTipo(t);
                  setTypeModalVisible(false);
                }}
              >
                <Text
                  style={[
                    localStyles.modalOptionText,
                    tipo === t && { color: COLORS.primary, fontWeight: "bold" },
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal para Seleccionar Categoría */}
      <Modal
        visible={categoryModalVisible}
        transparent={true}
        animationType="fade"
      >
        <TouchableOpacity
          style={localStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCategoryModalVisible(false)}
        >
          <View style={localStyles.modalContentCenter}>
            <Text style={localStyles.modalTitle}>Seleccionar Categoría</Text>
            <FlatList
              data={CATEGORIAS}
              keyExtractor={(item) => item}
              style={{ maxHeight: 350 }}
              renderItem={({ item: cat }) => (
                <TouchableOpacity
                  style={localStyles.modalOption}
                  onPress={() => {
                    setCategoria(cat);
                    setCategoryModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      localStyles.modalOptionText,
                      categoria === cat && {
                        color: COLORS.primary,
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  selectorInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    borderRadius: 8,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  modalContentCenter: {
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    width: "100%",
    padding: SPACING.lg,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  modalOption: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  modalOptionText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: "center",
  },
});

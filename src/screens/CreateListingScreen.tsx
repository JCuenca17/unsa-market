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
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { collection, addDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../services/firebaseConfig";
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
const MODALIDADES = ["Única vez (Un solo artículo)", "Múltiples / Continuo"];

export default function CreateListingScreen({ navigation }: any) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [tipo, setTipo] = useState("Producto");
  const [categoria, setCategoria] = useState("");
  const [modalidad, setModalidad] = useState("Única vez (Un solo artículo)");

  const [imagenesBase64, setImagenesBase64] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [modalidadModalVisible, setModalidadModalVisible] = useState(false);

  const pickImage = async () => {
    if (imagenesBase64.length >= 5) {
      Alert.alert("Límite alcanzado", "Puedes subir un máximo de 5 fotos.");
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

  const handlePublish = async () => {
    if (
      !titulo.trim() ||
      !precio.trim() ||
      !categoria ||
      imagenesBase64.length === 0
    ) {
      Alert.alert(
        "Campos incompletos",
        "Por favor completa todos los campos obligatorios y sube al menos una foto.",
      );
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setLoading(true);
    try {
      const listingData = {
        vendedor_id: currentUser.uid,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        precio: parseFloat(precio),
        tipo: tipo.toLowerCase(),
        categoria: categoria.trim(),
        modalidad: modalidad.includes("Única") ? "unica" : "multiple",
        estado: "activo",
        imagenes: imagenesBase64,
        fecha_creacion: new Date().toISOString(),
      };

      await addDoc(collection(db, "listings"), listingData);
      Alert.alert("¡Éxito!", "Tu anuncio ha sido publicado en la plataforma.");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        "Error",
        "No se pudo publicar el anuncio. Revisa tu conexión a internet.",
      );
    } finally {
      setLoading(false);
    }
  };

  const SelectorField = ({ label, value, onPress }: any) => (
    <View style={{ marginBottom: SPACING.md }}>
      <Text style={globalStyles.label}>{label} *</Text>
      <TouchableOpacity style={localStyles.selectorInput} onPress={onPress}>
        <Text
          style={{
            color: value ? COLORS.text : COLORS.textLight,
            fontSize: 16,
          }}
        >
          {value || "Seleccionar..."}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <ScrollView
        contentContainerStyle={[
          globalStyles.containerPadding,
          { paddingBottom: 60 },
        ]}
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
            <Ionicons
              name="camera-outline"
              size={30}
              color={COLORS.textLight}
            />
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
          placeholder="Ej. Libro de Cálculo Larson"
        />

        <SelectorField
          label="Tipo de Anuncio"
          value={tipo}
          onPress={() => setTypeModalVisible(true)}
        />
        <SelectorField
          label="Categoría"
          value={categoria}
          onPress={() => setCategoryModalVisible(true)}
        />
        <SelectorField
          label="Modalidad de Venta"
          value={modalidad}
          onPress={() => setModalidadModalVisible(true)}
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
          placeholder="Agrega detalles como estado, entregas..."
          multiline
          numberOfLines={5}
        />

        <TouchableOpacity
          style={[globalStyles.primaryButton, { marginTop: SPACING.lg }]}
          onPress={handlePublish}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={globalStyles.primaryButtonText}>Publicar Anuncio</Text>
          )}
        </TouchableOpacity>

        {/* Modales */}
        <Modal
          visible={typeModalVisible}
          transparent={true}
          animationType="fade"
        >
          <TouchableOpacity
            style={localStyles.modalOverlay}
            activeOpacity={1}
            onPress={() => setTypeModalVisible(false)}
          >
            <View style={localStyles.modalContentCenter}>
              <Text style={localStyles.modalTitle}>Tipo de Anuncio</Text>
              {TIPOS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={localStyles.modalOption}
                  onPress={() => {
                    setTipo(t);
                    setTypeModalVisible(false);
                  }}
                >
                  <Text style={localStyles.modalOptionText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

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
                style={{ maxHeight: 300 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={localStyles.modalOption}
                    onPress={() => {
                      setCategoria(item);
                      setCategoryModalVisible(false);
                    }}
                  >
                    <Text style={localStyles.modalOptionText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={modalidadModalVisible}
          transparent={true}
          animationType="fade"
        >
          <TouchableOpacity
            style={localStyles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalidadModalVisible(false)}
          >
            <View style={localStyles.modalContentCenter}>
              <Text style={localStyles.modalTitle}>
                ¿Cómo vas a vender esto?
              </Text>
              {MODALIDADES.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={localStyles.modalOption}
                  onPress={() => {
                    setModalidad(m);
                    setModalidadModalVisible(false);
                  }}
                >
                  <Text style={localStyles.modalOptionText}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
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
  selectorInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    borderRadius: 8,
  },
  textArea: { height: 120, textAlignVertical: "top" },
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
  modalOptionText: { fontSize: 16, color: COLORS.text, textAlign: "center" },
});

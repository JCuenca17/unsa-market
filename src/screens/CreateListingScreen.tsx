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
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

const CATEGORIAS_PRODUCTO = [
  "Libros",
  "Tecnología",
  "Alimentos",
  "Ropa",
  "Inmuebles",
  "Otros",
];
const CATEGORIAS_SERVICIO = [
  "Tutorías",
  "Asesorías",
  "Mantenimiento",
  "Trámites",
  "Otros",
];
const TIPOS = ["Producto", "Servicio"];
const MODALIDADES = ["Única vez (Un solo artículo)", "Múltiples / Continuo"];

// Creamos una interfaz para manejar la foto en pantalla y su texto Base64
interface ImagenUpload {
  uri: string;
  base64: string;
}

export default function CreateListingScreen({ navigation }: any) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [tipo, setTipo] = useState("Producto");
  const [categoria, setCategoria] = useState("");
  const [modalidad, setModalidad] = useState("Única vez (Un solo artículo)");

  // Usamos nuestro nuevo formato de imágenes
  const [imagenes, setImagenes] = useState<ImagenUpload[]>([]);
  const [loading, setLoading] = useState(false);

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [modalidadModalVisible, setModalidadModalVisible] = useState(false);

  const currentCategories =
    tipo === "Producto" ? CATEGORIAS_PRODUCTO : CATEGORIAS_SERVICIO;

  const handleTypeChange = (newType: string) => {
    setTipo(newType);
    setCategoria("");
    setTypeModalVisible(false);
  };

  const pickImage = async () => {
    if (imagenes.length >= 5) {
      Alert.alert("Límite alcanzado", "Puedes subir un máximo de 5 fotos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true, // Importante: ImgBB necesita el Base64
    });

    if (!result.canceled && result.assets[0].base64 && result.assets[0].uri) {
      // Guardamos la uri (para mostrarla en pantalla) y el base64 (para mandarlo a ImgBB)
      setImagenes([
        ...imagenes,
        {
          uri: result.assets[0].uri,
          base64: result.assets[0].base64,
        },
      ]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    const newImages = [...imagenes];
    newImages.splice(indexToRemove, 1);
    setImagenes(newImages);
  };

  // --- LA MAGIA DE IMGBB: Esta función sube las fotos y nos devuelve las URLs ---
  const uploadImagesToImgBB = async () => {
    const urls: string[] = [];
    // Aquí está la API KEY que me proporcionaste
    const IMGBB_API_KEY = "c57febdcd7411b93464a7f8bae43714e";

    for (const img of imagenes) {
      const formData = new FormData();
      formData.append("image", img.base64); // ImgBB recibe el texto base64 directo

      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        {
          method: "POST",
          body: formData,
        },
      );

      const json = await response.json();
      if (json.success) {
        // Extraemos el link cortito de la foto que nos da ImgBB
        urls.push(json.data.url);
      } else {
        throw new Error("No se pudo subir la imagen a ImgBB");
      }
    }
    return urls;
  };

  const handlePublish = async () => {
    if (
      !titulo.trim() ||
      !precio.trim() ||
      !categoria ||
      imagenes.length === 0
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
      // 1. SUBIMOS LAS FOTOS A IMGBB PRIMERO
      const urlsDescarga = await uploadImagesToImgBB();

      // 2. OBTENEMOS DATOS DEL USUARIO (Mantenemos la solución N+1)
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : null;

      // 3. GUARDAMOS EN TU BASE DE DATOS DE FIREBASE
      const listingData = {
        vendedor_id: currentUser.uid,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        precio: parseFloat(precio),
        tipo: tipo.toLowerCase(),
        categoria: categoria.trim(),
        modalidad: modalidad.includes("Única") ? "unica" : "multiple",
        estado: "activo",
        imagenes: urlsDescarga, // <-- GUARDAMOS SOLO LOS LINKS DE IMGBB
        fecha_creacion: new Date().toISOString(),
        vendedor_rating: userData?.rating_promedio || 0,
        vendedor_ventas: userData?.total_ventas || 0,
      };

      await addDoc(collection(db, "listings"), listingData);
      Alert.alert("¡Éxito!", "Tu anuncio ha sido publicado en la plataforma.");
      navigation.goBack();
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        "Tuvimos un problema subiendo las imágenes. Revisa tu conexión a internet e inténtalo de nuevo.",
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
        <Text style={globalStyles.label}>Fotos ({imagenes.length}/5) *</Text>
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
          {imagenes.map((img, index) => (
            <View key={index} style={localStyles.imageWrapper}>
              <Image source={{ uri: img.uri }} style={localStyles.thumbnail} />
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
                  onPress={() => handleTypeChange(t)}
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
                data={currentCategories}
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

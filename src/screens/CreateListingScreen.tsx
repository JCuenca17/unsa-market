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
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from "react-native";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { db, auth, storage } from "../services/firebaseConfig";

const CATEGORIAS = ["Libros", "Tecnología", "Alimentos", "Tutorías", "Otros"];

export default function CreateListingScreen({ navigation }: any) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [tipo, setTipo] = useState<"producto" | "servicio">("producto");
  const [categoria, setCategoria] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Función para abrir la galería
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Comprimimos la imagen para que suba más rápido
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePublish = async () => {
    if (!titulo || !precio || !categoria) {
      Alert.alert("Error", "Por favor completa los campos obligatorios.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setLoading(true);
    try {
      let downloadUrl = "";

      // Si el usuario seleccionó una imagen, la subimos a Firebase Storage primero
      if (imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();

        // Creamos una ruta única para la imagen
        const imageRef = ref(
          storage,
          `listings/${currentUser.uid}_${Date.now()}.jpg`,
        );
        await uploadBytes(imageRef, blob);
        downloadUrl = await getDownloadURL(imageRef);
      }

      // Guardamos los datos en Firestore (con o sin imagen)
      await addDoc(collection(db, "listings"), {
        vendedor_id: currentUser.uid,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        precio: parseFloat(precio),
        tipo: tipo,
        categoria: categoria.trim(),
        estado: "activo",
        imagen_url: downloadUrl, // Guardamos el link de la foto
        interesados: [],
        fecha_creacion: new Date().toISOString(),
      });

      Alert.alert("Éxito", "Tu anuncio ha sido publicado.");

      // Limpiamos todo
      setTitulo("");
      setDescripcion("");
      setPrecio("");
      setCategoria("");
      setImageUri(null);
      navigation.navigate("Inicio");
    } catch (error: any) {
      Alert.alert("Error al publicar", error.message);
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Crear Nuevo Anuncio</Text>

        <TouchableOpacity
          style={styles.imagePickerContainer}
          onPress={pickImage}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <Text style={styles.imagePickerText}>+ Añadir foto del {tipo}</Text>
          )}
        </TouchableOpacity>

        {/* --- El resto del formulario se mantiene igual --- */}
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              tipo === "producto" && styles.typeButtonActive,
            ]}
            onPress={() => setTipo("producto")}
          >
            <Text
              style={[
                styles.typeText,
                tipo === "producto" && styles.typeTextActive,
              ]}
            >
              Producto
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              tipo === "servicio" && styles.typeButtonActive,
            ]}
            onPress={() => setTipo("servicio")}
          >
            <Text
              style={[
                styles.typeText,
                tipo === "servicio" && styles.typeTextActive,
              ]}
            >
              Servicio
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={styles.input}
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Ej. Calculadora"
        />

        <Text style={styles.label}>Categoría *</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIAS.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                categoria === cat && styles.categoryChipActive,
              ]}
              onPress={() => setCategoria(cat)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  categoria === cat && styles.categoryChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Precio (S/) *</Text>
        <TextInput
          style={styles.input}
          value={precio}
          onChangeText={setPrecio}
          placeholder="0.00"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Detalles extra..."
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handlePublish}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Publicar Anuncio</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1, backgroundColor: "#f5f5f5" },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#5A0028",
    marginBottom: 20,
    textAlign: "center",
  },
  imagePickerContainer: {
    height: 150,
    backgroundColor: "#e1e4e8",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
  },
  imagePreview: { width: "100%", height: "100%" },
  imagePickerText: { color: "#666", fontWeight: "bold", fontSize: 16 },
  typeContainer: { flexDirection: "row", marginBottom: 20 },
  typeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#5A0028",
    alignItems: "center",
  },
  typeButtonActive: { backgroundColor: "#5A0028" },
  typeText: { color: "#5A0028", fontWeight: "bold" },
  typeTextActive: { color: "#fff" },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 5 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 15 },
  categoryChip: {
    backgroundColor: "#eee",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryChipActive: { backgroundColor: "#5A0028" },
  categoryChipText: { color: "#666", fontSize: 13 },
  categoryChipTextActive: { color: "#fff", fontWeight: "bold" },
  submitButton: {
    backgroundColor: "#5A0028",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

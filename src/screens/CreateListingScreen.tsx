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
} from "react-native";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../services/firebaseConfig";

export default function CreateListingScreen({ navigation }: any) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [tipo, setTipo] = useState<"producto" | "servicio">("producto");
  const [categoria, setCategoria] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    if (!titulo || !precio || !categoria) {
      Alert.alert(
        "Error",
        "Por favor completa los campos obligatorios (Título, Precio y Categoría).",
      );
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "Debes iniciar sesión para publicar.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "listings"), {
        vendedor_id: currentUser.uid,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        precio: parseFloat(precio),
        tipo: tipo,
        categoria: categoria.trim(),
        estado: "activo",
        interesados: [],
        fecha_creacion: new Date().toISOString(),
      });

      Alert.alert("Éxito", "Tu anuncio ha sido publicado.");
      // Limpiar el formulario
      setTitulo("");
      setDescripcion("");
      setPrecio("");
      setCategoria("");

      // Redirigir al inicio para ver el anuncio
      navigation.navigate("Inicio");
    } catch (error: any) {
      Alert.alert("Error al publicar", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Crear Nuevo Anuncio</Text>

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
          placeholder="Ej. Calculadora Científica Casio"
        />

        <Text style={styles.label}>Categoría *</Text>
        <TextInput
          style={styles.input}
          value={categoria}
          onChangeText={setCategoria}
          placeholder="Ej. Tecnología, Tutoría, Alimentos"
        />

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
          placeholder="Detalla el estado, horarios, etc."
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
  submitButton: {
    backgroundColor: "#5A0028",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

// src/screens/ReviewScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import {
  doc,
  collection,
  addDoc,
  updateDoc,
  getDocs,
  query,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

export default function ReviewScreen({ route, navigation }: any) {
  const { listing } = route.params;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      Alert.alert("Error", "Por favor escribe un comentario.");
      return;
    }
    setLoading(true);
    try {
      const vendedorId = listing.vendedor_id;

      // 1. Guardar la reseña
      await addDoc(collection(db, "users", vendedorId, "reviews"), {
        listing_id: listing.id,
        listing_titulo: listing.titulo,
        comprador_id: auth.currentUser?.uid,
        rating,
        comentario: comment.trim(),
        fecha: new Date().toISOString(),
      });

      // 2. Marcar anuncio como reseñado
      await updateDoc(doc(db, "listings", listing.id), {
        resena_completada: true,
      });

      // 3. Recalcular promedio del vendedor
      const q = query(collection(db, "users", vendedorId, "reviews"));
      const snap = await getDocs(q);
      let total = 0;
      snap.forEach((d) => (total += d.data().rating));
      const avg = total / snap.size;

      await updateDoc(doc(db, "users", vendedorId), {
        rating_promedio: avg,
        total_ventas: snap.size,
      });

      Alert.alert("¡Gracias!", "Tu calificación ayuda a la comunidad UNSA.");
      navigation.popToTop(); // Volver al inicio
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar la reseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={globalStyles.containerPadding}>
      <Text style={globalStyles.title}>Calificar Compra</Text>
      <Text style={localStyles.subtitle}>
        ¿Cómo fue tu experiencia adquiriendo "{listing.titulo}"?
      </Text>

      <View style={localStyles.starsContainer}>
        {[1, 2, 3, 4, 5].map((s) => (
          <TouchableOpacity key={s} onPress={() => setRating(s)}>
            <Ionicons
              name={s <= rating ? "star" : "star-outline"}
              size={45}
              color="#FFD700"
            />
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={[globalStyles.input, { height: 120, textAlignVertical: "top" }]}
        placeholder="Escribe un comentario sobre el producto y el vendedor..."
        multiline
        value={comment}
        onChangeText={setComment}
      />

      <TouchableOpacity
        style={globalStyles.primaryButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={globalStyles.primaryButtonText}>
            Enviar Calificación
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const localStyles = StyleSheet.create({
  subtitle: { textAlign: "center", marginBottom: 30, color: COLORS.textMuted },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
});

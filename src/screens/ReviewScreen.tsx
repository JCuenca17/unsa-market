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
import { globalStyles, COLORS } from "../theme/theme";

export default function ReviewScreen({ route, navigation }: any) {
  const { transaction } = route.params;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      Alert.alert(
        "Reseña incompleta",
        "Por favor describe brevemente cómo fue el trato con tu compañero.",
      );
      return;
    }
    setLoading(true);
    try {
      const vendedorId = transaction.vendedor_id;

      await addDoc(collection(db, "users", vendedorId, "reviews"), {
        listing_titulo: transaction.titulo,
        comprador_id: auth.currentUser?.uid,
        autor_email: auth.currentUser?.email,
        rating,
        comentario: comment.trim(),
        fecha: new Date().toISOString(),
      });

      await updateDoc(doc(db, "transactions", transaction.id), {
        calificado: true,
      });

      const q = query(collection(db, "users", vendedorId, "reviews"));
      const snap = await getDocs(q);
      let total = 0;
      snap.forEach((d) => {
        total += d.data().rating;
      });

      await updateDoc(doc(db, "users", vendedorId), {
        rating_promedio: total / snap.size,
        total_ventas: snap.size,
      });

      Alert.alert(
        "¡Enviado!",
        "Tu calificación ayudará a mantener la confianza en la comunidad.",
      );
      navigation.goBack();
    } catch (e) {
      Alert.alert(
        "Error",
        "No se pudo guardar la reseña. Verifica tu conexión.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={globalStyles.containerPadding}>
      <Text style={globalStyles.title}>Calificar al Vendedor</Text>
      <Text style={localStyles.subtitle}>
        ¿Cómo fue el trato de tu compañero al venderte "{transaction.titulo}"?
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

      <Text style={[globalStyles.label, { marginBottom: 10 }]}>Tu opinión</Text>
      <TextInput
        style={[globalStyles.input, { height: 120, textAlignVertical: "top" }]}
        placeholder="Evalúa su puntualidad, amabilidad y si el artículo era como se describió..."
        multiline
        value={comment}
        onChangeText={setComment}
      />

      <TouchableOpacity
        style={[globalStyles.primaryButton, { marginTop: 20 }]}
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
  subtitle: {
    textAlign: "center",
    marginBottom: 30,
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
});

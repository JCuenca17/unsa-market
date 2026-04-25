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
  const { transaction } = route.params;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      Alert.alert(
        "Reseña incompleta",
        "Por favor escribe un comentario sobre tu experiencia.",
      );
      return;
    }
    setLoading(true);
    try {
      const vendedorId = transaction.vendedor_id;

      await addDoc(collection(db, "users", vendedorId, "reviews"), {
        listing_titulo: transaction.titulo,
        comprador_id: auth.currentUser?.uid,
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
      snap.forEach((d) => (total += d.data().rating));

      await updateDoc(doc(db, "users", vendedorId), {
        rating_promedio: total / snap.size,
        total_ventas: snap.size,
      });

      Alert.alert("¡Enviado!", "Tu calificación ha sido registrada con éxito.");
      navigation.goBack();
    } catch (e) {
      Alert.alert(
        "Error de permisos",
        "No se pudo guardar la reseña. Verifica las reglas de Firestore.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={globalStyles.containerPadding}>
      <Text style={globalStyles.title}>Calificar Vendedor</Text>
      <Text style={styles.subtitle}>
        ¿Cómo fue tu experiencia con "{transaction.titulo}"?
      </Text>

      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setRating(s)}
            style={{ marginHorizontal: 5 }}
          >
            <Ionicons
              name={s <= rating ? "star" : "star-outline"}
              size={40}
              color="#FFD700"
            />
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={[globalStyles.input, { height: 120, textAlignVertical: "top" }]}
        placeholder="Comparte tu experiencia con otros estudiantes..."
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
          <Text style={globalStyles.primaryButtonText}>Publicar Reseña</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    textAlign: "center",
    marginBottom: 30,
    color: COLORS.textMuted,
    fontSize: 15,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 40,
  },
});

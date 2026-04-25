// src/screens/PublicProfileScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

interface Review {
  id: string;
  rating: number;
  comentario: string;
  autor_email: string;
  fecha: string;
  listing_titulo?: string;
}

export default function PublicProfileScreen({ route }: any) {
  const { vendedorId } = route.params;
  const [vendedor, setVendedor] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar datos del vendedor
        const userDoc = await getDoc(doc(db, "users", vendedorId));
        if (userDoc.exists()) setVendedor(userDoc.data());

        // Cargar reseñas
        const q = query(
          collection(db, "users", vendedorId, "reviews"),
          orderBy("fecha", "desc"),
        );
        const querySnapshot = await getDocs(q);
        const fetchedReviews: Review[] = [];

        querySnapshot.forEach((doc) => {
          fetchedReviews.push({ id: doc.id, ...doc.data() } as Review);
        });

        setReviews(fetchedReviews);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [vendedorId]);

  if (loading)
    return (
      <View style={globalStyles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  return (
    <View style={globalStyles.container}>
      {/* Cabecera del Perfil Público */}
      <View style={localStyles.header}>
        <View style={localStyles.avatarPlaceholder}>
          <Text style={localStyles.avatarText}>
            {vendedor?.nombre?.charAt(0) || "U"}
          </Text>
        </View>
        <Text style={localStyles.name}>
          {vendedor?.nombre || "Vendedor UNSA"}
        </Text>
        <Text style={localStyles.faculty}>{vendedor?.facultad || "UNSA"}</Text>
        <View style={localStyles.ratingBadge}>
          <Ionicons name="star" size={18} color="#FFD700" />
          <Text style={localStyles.ratingText}>
            {vendedor?.rating_promedio
              ? vendedor.rating_promedio.toFixed(1)
              : "Nuevo"}{" "}
            ({reviews.length} reseñas)
          </Text>
        </View>
      </View>

      {/* Lista de Reseñas */}
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.md }}
        ListHeaderComponent={
          <Text style={localStyles.sectionTitle}>
            Comentarios de compradores
          </Text>
        }
        ListEmptyComponent={
          <Text style={globalStyles.emptyText}>
            Este vendedor aún no tiene reseñas.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={localStyles.reviewCard}>
            <View style={localStyles.reviewHeader}>
              {/* Muestra solo la primera parte del correo para privacidad */}
              <Text style={localStyles.reviewAuthor}>
                {item.autor_email?.split("@")[0] || "Usuario"}
              </Text>
              <View style={{ flexDirection: "row" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= item.rating ? "star" : "star-outline"}
                    size={14}
                    color="#FFD700"
                  />
                ))}
              </View>
            </View>
            {item.listing_titulo && (
              <Text style={localStyles.listingTitle}>
                Compró: {item.listing_titulo}
              </Text>
            )}
            <Text style={localStyles.reviewComment}>{item.comentario}</Text>
          </View>
        )}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.xl,
    elevation: 2,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: SPACING.sm,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  avatarText: { color: COLORS.surface, fontSize: 32, fontWeight: "bold" },
  name: { fontSize: 22, fontWeight: "bold", color: COLORS.text },
  faculty: { fontSize: 14, color: COLORS.textMuted, marginBottom: SPACING.sm },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff9c4",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
  },
  ratingText: { marginLeft: 5, fontWeight: "bold", color: "#8b8000" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  reviewCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 10,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },
  reviewAuthor: { fontWeight: "bold", color: COLORS.textMuted, fontSize: 13 },
  listingTitle: {
    fontSize: 12,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    fontStyle: "italic",
  },
  reviewComment: { color: COLORS.text, fontSize: 14 },
});

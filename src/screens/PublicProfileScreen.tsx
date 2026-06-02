// src/screens/PublicProfileScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

export default function PublicProfileScreen({ route, navigation }: any) {
  const { vendedorId } = route.params;
  const [vendedor, setVendedor] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        // 1. Obtener datos del vendedor
        const vSnap = await getDoc(doc(db, "users", vendedorId));
        if (vSnap.exists()) {
          setVendedor(vSnap.data());
        }

        // 2. Obtener anuncios activos del vendedor
        const q = query(
          collection(db, "listings"),
          where("vendedor_id", "==", vendedorId),
          where("estado", "==", "activo"),
        );
        const lSnap = await getDocs(q);
        const fetchedListings: any[] = [];
        lSnap.forEach((d) => fetchedListings.push({ id: d.id, ...d.data() }));
        setListings(fetchedListings);
      } catch (error) {
        console.log("Error cargando perfil público", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
  }, [vendedorId]);

  // LÓGICA DE ESTRELLAS PROFESIONALES
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        // Estrella completa
        stars.push(<Ionicons key={i} name="star" size={20} color="#FFD700" />);
      } else if (rating >= i - 0.5) {
        // Media estrella
        stars.push(
          <Ionicons key={i} name="star-half" size={20} color="#FFD700" />,
        );
      } else {
        // Estrella vacía
        stars.push(
          <Ionicons key={i} name="star-outline" size={20} color="#FFD700" />,
        );
      }
    }
    return <View style={localStyles.starsContainer}>{stars}</View>;
  };

  const renderItem = ({ item }: any) => {
    const defaultImage =
      item.tipo === "producto"
        ? "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"
        : "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&q=80";
    const coverImage =
      item.imagenes && item.imagenes.length > 0
        ? item.imagenes[0]
        : defaultImage;

    return (
      <TouchableOpacity
        style={localStyles.card}
        onPress={() => navigation.navigate("ListingDetail", { item })}
        activeOpacity={0.9}
      >
        <Image source={{ uri: coverImage }} style={localStyles.cardImage} />
        <View style={localStyles.cardContent}>
          <Text style={localStyles.price}>S/ {item.precio.toFixed(2)}</Text>
          <Text style={localStyles.title} numberOfLines={2}>
            {item.titulo}
          </Text>
          <Text style={localStyles.category}>{item.categoria}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={globalStyles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const rating = vendedor?.rating_promedio || 0;

  return (
    <View style={globalStyles.container}>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={localStyles.row}
        contentContainerStyle={localStyles.listContainer}
        ListHeaderComponent={
          <View style={localStyles.headerWrapper}>
            <View style={localStyles.profileHeader}>
              <View style={localStyles.avatarPlaceholder}>
                <Ionicons name="person" size={50} color="#fff" />
              </View>
              <Text style={localStyles.name}>
                {vendedor?.nombre || "Estudiante"}
              </Text>
              <Text style={localStyles.facultad}>
                {vendedor?.facultad || "Facultad no registrada"}
              </Text>
            </View>

            <View style={localStyles.statsCard}>
              <View style={localStyles.statItem}>
                <Text style={localStyles.statLabel}>Reputación</Text>
                {renderStars(rating)}
                <Text style={localStyles.statNumber}>
                  {rating.toFixed(1)} / 5.0
                </Text>
              </View>
              <View style={localStyles.divider} />
              <View style={localStyles.statItem}>
                <Text style={localStyles.statLabel}>Ventas</Text>
                <Ionicons
                  name="cart-outline"
                  size={24}
                  color={COLORS.primary}
                  style={{ marginVertical: 3 }}
                />
                <Text style={localStyles.statNumber}>
                  {vendedor?.total_ventas || 0} completadas
                </Text>
              </View>
            </View>

            <Text style={localStyles.sectionTitle}>
              Anuncios de {vendedor?.nombre}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={globalStyles.emptyText}>
            Este estudiante no tiene anuncios activos en este momento.
          </Text>
        }
        renderItem={renderItem}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  headerWrapper: { padding: SPACING.md },
  profileHeader: {
    alignItems: "center",
    marginBottom: SPACING.xl,
    marginTop: SPACING.sm,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  name: { fontSize: 24, fontWeight: "bold", color: COLORS.text },
  facultad: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 4,
    fontWeight: "600",
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statItem: { flex: 1, alignItems: "center" },
  divider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 5,
  },
  starsContainer: { flexDirection: "row", marginVertical: 5 },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginLeft: 5,
  },
  listContainer: { paddingBottom: 100 },
  row: { justifyContent: "space-between", paddingHorizontal: SPACING.sm },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: SPACING.md,
    marginHorizontal: 5,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    maxWidth: "48%",
  },
  cardImage: { width: "100%", height: 140, backgroundColor: COLORS.border },
  cardContent: { padding: SPACING.sm },
  price: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: "bold",
    marginBottom: 4,
  },
  title: { fontSize: 13, color: COLORS.textMuted, marginBottom: 6, height: 35 },
  category: {
    color: COLORS.textLight,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});

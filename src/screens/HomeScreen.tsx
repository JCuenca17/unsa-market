// src/screens/HomeScreen.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

interface Listing {
  id: string;
  titulo: string;
  precio: number;
  tipo: string;
  categoria: string;
  imagenes?: string[];
}

export default function HomeScreen({ navigation }: any) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchListings = async () => {
    try {
      const q = query(
        collection(db, "listings"),
        where("estado", "==", "activo"),
        orderBy("fecha_creacion", "desc"),
      );
      const querySnapshot = await getDocs(q);
      const fetchedListings: Listing[] = [];
      querySnapshot.forEach((doc) =>
        fetchedListings.push({ id: doc.id, ...doc.data() } as Listing),
      );
      setListings(fetchedListings);
    } catch (error) {
      console.error("Error al descargar catálogo:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchListings();
    }, []),
  );
  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const renderItem = ({ item }: { item: Listing }) => {
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

  return (
    <View style={globalStyles.container}>
      {loading ? (
        <View style={globalStyles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={localStyles.row}
          contentContainerStyle={{ padding: SPACING.sm }}
          ListEmptyComponent={
            <Text style={globalStyles.emptyText}>
              No hay anuncios disponibles en este momento.
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  row: { justifyContent: "space-between" },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
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
    fontWeight: "500",
    textTransform: "uppercase",
  },
});

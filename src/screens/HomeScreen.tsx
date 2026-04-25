// src/screens/HomeScreen.tsx
import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

const CATEGORIAS = [
  "Todos",
  "Libros",
  "Tecnología",
  "Alimentos",
  "Tutorías",
  "Otros",
];

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

  // Estados para búsqueda y filtrado
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const fetchListings = async () => {
    try {
      const q = query(
        collection(db, "listings"),
        where("estado", "==", "activo"),
        orderBy("fecha_creacion", "desc"),
      );

      const querySnapshot = await getDocs(q);
      const fetchedListings: Listing[] = [];

      querySnapshot.forEach((doc) => {
        fetchedListings.push({ id: doc.id, ...doc.data() } as Listing);
      });

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

  // Lógica de filtrado en tiempo real
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const matchesSearch = item.titulo
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const matchesCategory =
        selectedCategory === "Todos" || item.categoria === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [listings, searchText, selectedCategory]);

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
      {/* Cabecera con Búsqueda */}
      <View style={localStyles.headerContainer}>
        <View style={localStyles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color={COLORS.textLight}
            style={{ marginRight: 10 }}
          />
          <TextInput
            style={localStyles.searchInput}
            placeholder="Buscar en UNSA Market..."
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText !== "" && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Chips de Categorías */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={localStyles.categoriesScroll}
        >
          {CATEGORIAS.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                localStyles.categoryChip,
                selectedCategory === cat && localStyles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  localStyles.categoryChipText,
                  selectedCategory === cat &&
                    localStyles.categoryChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={globalStyles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredListings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={localStyles.row}
          contentContainerStyle={localStyles.listContainer}
          ListEmptyComponent={
            <Text style={globalStyles.emptyText}>
              No se encontraron resultados para tu búsqueda.
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
  headerContainer: {
    backgroundColor: COLORS.surface,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    marginHorizontal: SPACING.lg,
    paddingHorizontal: SPACING.md,
    height: 45,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  categoriesScroll: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "500",
  },
  categoryChipTextActive: {
    color: COLORS.surface,
    fontWeight: "bold",
  },
  listContainer: {
    padding: SPACING.sm,
  },
  row: {
    justifyContent: "space-between",
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: SPACING.md,
    marginHorizontal: 5,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    maxWidth: "48%",
  },
  cardImage: {
    width: "100%",
    height: 140,
    backgroundColor: COLORS.border,
  },
  cardContent: {
    padding: SPACING.sm,
  },
  price: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: "bold",
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 6,
    height: 35,
  },
  category: {
    color: COLORS.textLight,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});

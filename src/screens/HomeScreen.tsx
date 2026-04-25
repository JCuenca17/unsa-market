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
  Modal,
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
  "Inmuebles",
  "Servicios",
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
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  // Estado para el panel de filtros
  const [filterModalVisible, setFilterModalVisible] = useState(false);

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
      {/* Cabecera compacta y profesional */}
      <View style={localStyles.headerContainer}>
        <View style={localStyles.searchRow}>
          <View style={localStyles.searchBar}>
            <Ionicons
              name="search"
              size={20}
              color={COLORS.textLight}
              style={{ marginRight: SPACING.sm }}
            />
            <TextInput
              style={localStyles.searchInput}
              placeholder="Buscar anuncios..."
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
          {/* Botón para abrir el panel de filtros */}
          <TouchableOpacity
            style={localStyles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="options-outline" size={24} color={COLORS.surface} />
          </TouchableOpacity>
        </View>
        {selectedCategory !== "Todos" && (
          <View style={localStyles.activeFilterRow}>
            <Text style={localStyles.activeFilterText}>
              Categoría: {selectedCategory}
            </Text>
            <TouchableOpacity onPress={() => setSelectedCategory("Todos")}>
              <Ionicons name="close" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        )}
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
              No se encontraron resultados.
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

      {/* Floating Action Button (FAB) para publicar */}
      <TouchableOpacity
        style={localStyles.fab}
        onPress={() => navigation.navigate("Publicar")}
      >
        <Ionicons name="add" size={32} color={COLORS.surface} />
      </TouchableOpacity>

      {/* Modal de Filtros (Bottom Sheet Nativos) */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <View style={localStyles.modalHeader}>
              <Text style={localStyles.modalTitle}>Filtrar Categorías</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CATEGORIAS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    localStyles.categoryOption,
                    selectedCategory === item &&
                      localStyles.categoryOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedCategory(item);
                    setFilterModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      localStyles.categoryOptionText,
                      selectedCategory === item &&
                        localStyles.categoryOptionTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                  {selectedCategory === item && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.surface,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 1,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    height: 45,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },
  filterButton: {
    backgroundColor: COLORS.primary,
    height: 45,
    width: 45,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  activeFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0e6ea",
    alignSelf: "flex-start",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 15,
    marginLeft: SPACING.lg,
    marginTop: SPACING.xs,
  },
  activeFilterText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
  listContainer: { padding: SPACING.sm, paddingBottom: 100 }, // Espacio para que el FAB no tape contenido
  row: { justifyContent: "space-between" },
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

  // Estilos del Botón Flotante
  fab: {
    position: "absolute",
    bottom: SPACING.xl,
    right: SPACING.lg,
    backgroundColor: COLORS.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },

  // Estilos del Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.text },
  categoryOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryOptionActive: { backgroundColor: "#fafafa" },
  categoryOptionText: { fontSize: 16, color: COLORS.text },
  categoryOptionTextActive: { color: COLORS.primary, fontWeight: "bold" },
});

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
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

const CATEGORIAS_PRODUCTO = [
  "Libros",
  "Tecnología",
  "Alimentos",
  "Ropa",
  "Inmuebles",
  "Otros",
];
const CATEGORIAS_SERVICIO = [
  "Tutorías",
  "Asesorías",
  "Mantenimiento",
  "Trámites",
  "Otros",
];

interface Listing {
  id: string;
  titulo: string;
  precio: number;
  tipo: string;
  categoria: string;
  vendedor_id: string;
  fecha_creacion: string;
  imagenes?: string[];
  vendedor_rating?: number;
  vendedor_ventas?: number;
}

export default function HomeScreen({ navigation }: any) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [activeTab, setActiveTab] = useState<"producto" | "servicio">(
    "producto",
  );
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const currentCategories = [
    "Todos",
    ...(activeTab === "producto" ? CATEGORIAS_PRODUCTO : CATEGORIAS_SERVICIO),
  ];

  // Identificamos si es invitado para la UI
  const isGuest = auth.currentUser?.isAnonymous;

  const fetchListings = async () => {
    try {
      // SOLUCIÓN N+1: 1 sola consulta simple para traer todos los anuncios
      const q = query(
        collection(db, "listings"),
        where("estado", "==", "activo"),
      );
      const querySnapshot = await getDocs(q);

      const rawListings: Listing[] = [];
      querySnapshot.forEach((d) =>
        rawListings.push({ id: d.id, ...d.data() } as Listing),
      );

      // SOLUCIÓN N+1: Ordenamos utilizando directamente los datos que ya vienen dentro del anuncio
      rawListings.sort((a, b) => {
        if (b.vendedor_rating !== a.vendedor_rating) {
          return (b.vendedor_rating || 0) - (a.vendedor_rating || 0);
        }
        if (b.vendedor_ventas !== a.vendedor_ventas) {
          return (b.vendedor_ventas || 0) - (a.vendedor_ventas || 0);
        }
        const dateA = a.fecha_creacion
          ? new Date(a.fecha_creacion).getTime()
          : 0;
        const dateB = b.fecha_creacion
          ? new Date(b.fecha_creacion).getTime()
          : 0;
        return dateB - dateA;
      });

      setListings(rawListings);
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

  const handleTabChange = (tab: "producto" | "servicio") => {
    setActiveTab(tab);
    setSelectedCategory("Todos");
  };

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const matchesSearch = item.titulo
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const matchesCategory =
        selectedCategory === "Todos" || item.categoria === selectedCategory;
      const matchesTab = item.tipo === activeTab;
      return matchesSearch && matchesCategory && matchesTab;
    });
  }, [listings, searchText, selectedCategory, activeTab]);

  const renderItem = ({ item }: { item: Listing }) => {
    const defaultImage =
      item.tipo === "producto"
        ? "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"
        : "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&q=80";
    const coverImage =
      item.imagenes && item.imagenes.length > 0
        ? item.imagenes[0]
        : defaultImage;

    const isTop =
      (item.vendedor_rating || 0) >= 4.0 && (item.vendedor_ventas || 0) >= 1;

    return (
      <TouchableOpacity
        style={localStyles.card}
        onPress={() => navigation.navigate("ListingDetail", { item })}
        activeOpacity={0.9}
      >
        <View style={localStyles.imageContainer}>
          <Image source={{ uri: coverImage }} style={localStyles.cardImage} />
          {isTop && (
            <View style={localStyles.topBadge}>
              <Ionicons name="star" size={10} color="#fff" />
              <Text style={localStyles.topBadgeText}>TOP</Text>
            </View>
          )}
        </View>

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
              placeholder="Buscar..."
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
          <TouchableOpacity
            style={localStyles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="options-outline" size={24} color={COLORS.surface} />
          </TouchableOpacity>

          {/* BOTÓN PARA SALIR DEL MODO INVITADO */}
          {isGuest && (
            <TouchableOpacity
              style={[
                localStyles.filterButton,
                { backgroundColor: COLORS.danger, marginLeft: 8 },
              ]}
              onPress={() => signOut(auth)}
            >
              <Ionicons name="exit-outline" size={24} color={COLORS.surface} />
            </TouchableOpacity>
          )}
        </View>

        <View style={localStyles.segmentedControl}>
          <TouchableOpacity
            style={[
              localStyles.segmentButton,
              activeTab === "producto" && localStyles.segmentButtonActive,
            ]}
            onPress={() => handleTabChange("producto")}
          >
            <Text
              style={[
                localStyles.segmentText,
                activeTab === "producto" && localStyles.segmentTextActive,
              ]}
            >
              Productos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              localStyles.segmentButton,
              activeTab === "servicio" && localStyles.segmentButtonActive,
            ]}
            onPress={() => handleTabChange("servicio")}
          >
            <Text
              style={[
                localStyles.segmentText,
                activeTab === "servicio" && localStyles.segmentTextActive,
              ]}
            >
              Servicios
            </Text>
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

      {/* BLOQUEO DEL BOTÓN FLOTANTE PARA INVITADOS */}
      <TouchableOpacity
        style={localStyles.fab}
        onPress={() => {
          if (isGuest) {
            Alert.alert(
              "Función Restringida",
              "Para publicar un anuncio, debes registrarte con tu correo universitario @unsa.edu.pe",
              [{ text: "Entendido" }],
            );
          } else {
            navigation.navigate("Publicar");
          }
        }}
      >
        <Ionicons name="add" size={32} color={COLORS.surface} />
      </TouchableOpacity>

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
              data={currentCategories}
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
    paddingBottom: SPACING.md,
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
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginHorizontal: SPACING.lg,
    marginTop: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  segmentText: { fontSize: 14, fontWeight: "600", color: COLORS.textMuted },
  segmentTextActive: { color: COLORS.text },
  activeFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0e6ea",
    alignSelf: "flex-start",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 15,
    marginLeft: SPACING.lg,
    marginTop: 10,
  },
  activeFilterText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
  listContainer: { padding: SPACING.sm, paddingBottom: 100 },
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
  imageContainer: {
    position: "relative",
  },
  cardImage: { width: "100%", height: 140, backgroundColor: COLORS.border },
  topBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FFD700",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#4a3c00",
    marginLeft: 3,
  },
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

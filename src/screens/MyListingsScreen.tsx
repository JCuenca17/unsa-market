// src/screens/MyListingsScreen.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

interface Listing {
  id: string;
  titulo: string;
  precio: number;
  descripcion: string;
  categoria: string;
  tipo: string;
  imagenes?: string[];
}

export default function MyListingsScreen({ navigation }: any) {
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyListings = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const q = query(
        collection(db, "listings"),
        where("vendedor_id", "==", currentUser.uid),
      );
      const querySnapshot = await getDocs(q);
      const items: Listing[] = [];
      querySnapshot.forEach((doc) =>
        items.push({ id: doc.id, ...doc.data() } as Listing),
      );
      setMyListings(items);
    } catch (error) {
      console.error("Error al obtener mis anuncios:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyListings();
    }, []),
  );

  const confirmDelete = (id: string) => {
    Alert.alert(
      "Eliminar Anuncio",
      "¿Estás seguro? Esta acción borrará el anuncio de la tienda.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => handleDelete(id),
        },
      ],
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "listings", id));
      fetchMyListings();
    } catch (error) {
      Alert.alert("Error", "No se pudo eliminar el anuncio.");
    }
  };

  const renderItem = ({ item }: { item: Listing }) => (
    <View style={localStyles.card}>
      <Image
        source={{
          uri:
            item.imagenes && item.imagenes.length > 0
              ? item.imagenes[0]
              : "https://via.placeholder.com/150",
        }}
        style={localStyles.thumbnail}
      />
      <View style={localStyles.info}>
        <Text style={localStyles.title} numberOfLines={1}>
          {item.titulo}
        </Text>
        <Text style={localStyles.price}>S/ {item.precio.toFixed(2)}</Text>
      </View>
      <View style={localStyles.actionContainer}>
        {/* Botón de Editar con Icono */}
        <TouchableOpacity
          style={localStyles.editIconButton}
          onPress={() => navigation.navigate("EditListing", { item })}
        >
          <Ionicons name="pencil-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        {/* Botón de Eliminar con Icono */}
        <TouchableOpacity
          style={localStyles.deleteIconButton}
          onPress={() => confirmDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={globalStyles.container}>
      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={myListings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: SPACING.md }}
          ListEmptyComponent={
            <Text style={globalStyles.emptyText}>
              Aún no has publicado nada.
            </Text>
          }
        />
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
    elevation: 2,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.border,
  },
  info: { flex: 1, marginLeft: 15, marginRight: 10 },
  title: { fontSize: 16, fontWeight: "bold", color: COLORS.text },
  price: { fontSize: 14, color: COLORS.primary, marginTop: 2 },
  actionContainer: { flexDirection: "row", alignItems: "center" },
  editIconButton: {
    padding: SPACING.xs,
    marginRight: SPACING.xs,
    backgroundColor: "#f0e6ea",
    borderRadius: 8,
  },
  deleteIconButton: {
    padding: SPACING.xs,
    backgroundColor: COLORS.dangerLight,
    borderRadius: 8,
  },
});

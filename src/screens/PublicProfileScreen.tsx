// src/screens/PublicProfileScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
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
import { COLORS, SPACING } from "../theme/theme";

export default function PublicProfileScreen({ route, navigation }: any) {
  const { vendedorId } = route.params;
  const [vendedor, setVendedor] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Obtener datos del vendedor
        const vDoc = await getDoc(doc(db, "users", vendedorId));
        if (vDoc.exists()) {
          setVendedor(vDoc.data());
        }

        // 2. Obtener sus publicaciones activas
        const q = query(
          collection(db, "listings"),
          where("vendedor_id", "==", vendedorId),
        );
        const lSnap = await getDocs(q);
        setListings(lSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Error al cargar perfil público:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [vendedorId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* CABECERA DEL PERFIL */}
      <View style={styles.header}>
        <Image
          source={{
            uri: vendedor?.photoURL || "https://via.placeholder.com/150",
          }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{vendedor?.nombre || "Estudiante UNSA"}</Text>
        <Text style={styles.sub}>{vendedor?.facultad}</Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>
            ⭐ {vendedor?.rating_promedio?.toFixed(1) || "Nuevo"}
          </Text>
          <Text style={{ marginHorizontal: 15, color: COLORS.textLight }}>
            |
          </Text>
          <Text style={styles.statText}>
            {vendedor?.total_ventas || 0} Ventas
          </Text>
        </View>
      </View>

      {/* LISTA DE PUBLICACIONES DEL VENDEDOR */}
      <Text style={styles.listTitle}>Publicaciones Activas</Text>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.listingItem}
            // Navegación al detalle del anuncio pasando el objeto completo
            onPress={() => navigation.navigate("ListingDetail", { item })}
          >
            {/* Imagen en miniatura */}
            {item.imagenes && item.imagenes.length > 0 ? (
              <Image
                source={{ uri: item.imagenes[0] }}
                style={styles.listingImage}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="image-outline" size={24} color="#ccc" />
              </View>
            )}

            {/* Detalles del anuncio */}
            <View style={styles.listingInfo}>
              <Text style={styles.listingTitle}>{item.titulo}</Text>
              <Text style={styles.listingPrice}>S/ {item.precio}</Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textLight}
            />
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>
            Este estudiante no tiene publicaciones activas.
          </Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    backgroundColor: "#eee",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
  },
  sub: {
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 4,
  },
  stats: {
    flexDirection: "row",
    marginTop: 10,
    alignItems: "center",
  },
  statText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  listTitle: {
    padding: 15,
    fontWeight: "bold",
    fontSize: 18,
    color: COLORS.text,
  },
  listingItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
  },
  listingImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 15,
  },
  placeholderImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#eee",
    marginRight: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: COLORS.text,
  },
  listingPrice: {
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 4,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.textLight,
    marginTop: 20,
  },
});

// src/screens/HomeScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../services/firebaseConfig";

interface Listing {
  id: string;
  titulo: string;
  precio: number;
  tipo: string;
  categoria: string;
  imagen_url?: string; // Habilitamos el espacio para la imagen
}

export default function HomeScreen({ navigation }: any) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "listings"),
      where("estado", "==", "activo"),
      orderBy("fecha_creacion", "desc"),
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedListings: Listing[] = [];
      querySnapshot.forEach((doc) => {
        fetchedListings.push({ id: doc.id, ...doc.data() } as Listing);
      });
      setListings(fetchedListings);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }: { item: Listing }) => {
    // Imagen por defecto temporal para que el UI se vea como un marketplace real
    const defaultImage =
      item.tipo === "producto"
        ? "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80" // Audífonos (Tecnología)
        : "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&q=80"; // Estudiantes estudiando (Servicio)

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("ListingDetail", { item })}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: item.imagen_url || defaultImage }}
          style={styles.cardImage}
        />
        <View style={styles.cardContent}>
          <Text style={styles.price}>S/ {item.precio.toFixed(2)}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {item.titulo}
          </Text>
          <Text style={styles.category}>{item.categoria}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5A0028" />
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2} // ¡El truco mágico para el grid!
          columnWrapperStyle={styles.row} // Estilo para separar las columnas
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No hay anuncios disponibles en este momento.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" }, // Gris más claro de fondo
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { padding: 10 },
  row: { justifyContent: "space-between" }, // Separa equitativamente las dos tarjetas
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 15,
    marginHorizontal: 5,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    maxWidth: "48%", // Asegura que quepan exactamente 2 por fila
  },
  cardImage: { width: "100%", height: 140, backgroundColor: "#e1e4e8" },
  cardContent: { padding: 10 },
  price: { fontSize: 18, color: "#333", fontWeight: "bold", marginBottom: 4 },
  title: { fontSize: 13, color: "#555", marginBottom: 6, height: 35 },
  category: {
    color: "#888",
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#999",
    fontSize: 16,
  },
});

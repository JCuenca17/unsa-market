// src/screens/HomeScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebaseConfig";

// Definición de la estructura de un Anuncio
interface Listing {
  id: string;
  titulo: string;
  precio: string;
  tipo: string;
  categoria: string;
}

export default function HomeScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // Función para descargar los datos de Firebase
  const fetchListings = async () => {
    setLoading(true);
    try {
      // Consultamos la colección "listings" filtrando solo los que están "activos"
      const q = query(
        collection(db, "listings"),
        where("estado", "==", "activo"),
      );
      const querySnapshot = await getDocs(q);

      const fetchedListings: Listing[] = [];
      querySnapshot.forEach((doc) => {
        fetchedListings.push({ id: doc.id, ...doc.data() } as Listing);
      });

      setListings(fetchedListings);
    } catch (error) {
      console.log("Error obteniendo anuncios: ", error);
    } finally {
      setLoading(false);
    }
  };

  // Se ejecuta automáticamente al abrir la pantalla
  useEffect(() => {
    fetchListings();
  }, []);

  // Diseño individual de cada tarjeta de producto/servicio
  const renderItem = ({ item }: { item: Listing }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.badge}>{item.tipo.toUpperCase()}</Text>
        <Text style={styles.category}>{item.categoria}</Text>
      </View>
      <Text style={styles.title}>{item.titulo}</Text>
      <Text style={styles.price}>S/ {item.precio}</Text>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Ver detalles</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5A0028" />
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Aún no hay anuncios disponibles.</Text>
          <TouchableOpacity style={styles.reloadButton} onPress={fetchListings}>
            <Text style={styles.reloadText}>Actualizar Catálogo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          onRefresh={fetchListings}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { padding: 15 },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  badge: {
    backgroundColor: "#eee",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    overflow: "hidden",
  },
  category: { color: "#666", fontSize: 12 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 5, color: "#333" },
  price: {
    fontSize: 16,
    color: "#5A0028",
    fontWeight: "bold",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#5A0028",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  emptyText: { fontSize: 16, color: "#666", marginBottom: 15 },
  reloadButton: {
    padding: 10,
    borderColor: "#5A0028",
    borderWidth: 1,
    borderRadius: 5,
  },
  reloadText: { color: "#5A0028", fontWeight: "bold" },
});

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
}

export default function HomeScreen(navigation: any) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Definimos la consulta: Activos y ordenados por fecha
    const q = query(
      collection(db, "listings"),
      where("estado", "==", "activo"),
      orderBy("fecha_creacion", "desc"),
    );

    // onSnapshot escucha cambios en tiempo real
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedListings: Listing[] = [];
        querySnapshot.forEach((doc) => {
          fetchedListings.push({ id: doc.id, ...doc.data() } as Listing);
        });
        setListings(fetchedListings);
        setLoading(false);
      },
      (error) => {
        console.error("Error en tiempo real:", error);
        setLoading(false);
      },
    );

    // Limpiar el listener cuando el usuario sale de la pantalla
    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }: { item: Listing }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("ListingDetail", { item })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text
          style={[
            styles.badge,
            {
              backgroundColor: item.tipo === "producto" ? "#E3F2FD" : "#F3E5F5",
            },
          ]}
        >
          {item.tipo.toUpperCase()}
        </Text>
        <Text style={styles.category}>{item.categoria}</Text>
      </View>
      <Text style={styles.title}>{item.titulo}</Text>
      <Text style={styles.price}>S/ {item.precio.toFixed(2)}</Text>
    </TouchableOpacity>
  );

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
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { padding: 15 },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: "bold",
    color: "#333",
    overflow: "hidden",
  },
  category: { color: "#888", fontSize: 12, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 4 },
  price: { fontSize: 16, color: "#5A0028", fontWeight: "bold" },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#999",
    fontSize: 16,
  },
});

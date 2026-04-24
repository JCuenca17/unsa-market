// src/screens/ListingDetailScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebaseConfig";

export default function ListingDetailScreen({ route, navigation }: any) {
  // Recibimos los datos del anuncio seleccionado
  const { item } = route.params;
  const [vendedorPhone, setVendedorPhone] = useState("");
  const [vendedorNombre, setVendedorNombre] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        const sellerDoc = await getDoc(doc(db, "users", item.vendedor_id));
        if (sellerDoc.exists()) {
          setVendedorPhone(sellerDoc.data().whatsapp || "");
          setVendedorNombre(sellerDoc.data().nombre || "Compañero UNSA");
        }
      } catch (error) {
        console.error("Error obteniendo datos del vendedor:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSellerData();
  }, [item.vendedor_id]);

  const handleContact = () => {
    if (!vendedorPhone) {
      Alert.alert(
        "Aviso",
        "El vendedor no tiene un número de WhatsApp registrado.",
      );
      return;
    }

    const mensaje = `Hola ${vendedorNombre}, vi tu anuncio "${item.titulo}" en UNSA Market. ¿Sigue disponible?`;
    // Usamos wa.me que es el formato universal de WhatsApp
    const url = `https://wa.me/51${vendedorPhone}?text=${encodeURIComponent(mensaje)}`;

    Linking.openURL(url).catch((err) => {
      Alert.alert("Error", "No se pudo abrir WhatsApp. Verifica tu conexión.");
      console.error(err);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.badge}>{item.tipo.toUpperCase()}</Text>
        <Text style={styles.category}>{item.categoria}</Text>
      </View>

      <Text style={styles.title}>{item.titulo}</Text>
      <Text style={styles.price}>S/ {item.precio.toFixed(2)}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.description}>
          {item.descripcion || "Sin descripción adicional."}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vendedor</Text>
        {loading ? (
          <ActivityIndicator color="#5A0028" />
        ) : (
          <Text style={styles.sellerName}>{vendedorNombre}</Text>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
          <Text style={styles.contactButtonText}>Contactar por WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  badge: {
    backgroundColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  category: { color: "#666", fontSize: 14, fontWeight: "600" },
  title: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 10 },
  price: {
    fontSize: 22,
    color: "#5A0028",
    fontWeight: "bold",
    marginBottom: 20,
  },
  section: { marginBottom: 25 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
  },
  description: { fontSize: 15, color: "#555", lineHeight: 22 },
  sellerName: { fontSize: 16, color: "#333" },
  footer: { marginTop: "auto", paddingTop: 20 },
  contactButton: {
    backgroundColor: "#25D366",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  }, // Color verde de WhatsApp
  contactButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

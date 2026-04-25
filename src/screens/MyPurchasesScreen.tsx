// src/screens/MyPurchasesScreen.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, auth } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

export default function MyPurchasesScreen({ navigation }: any) {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const q = query(
        collection(db, "transactions"),
        where("comprador_id", "==", user.uid),
      );
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPurchases(items);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPurchases();
    }, []),
  );

  const renderItem = ({ item }: any) => (
    <View style={localStyles.card}>
      <Image
        source={{ uri: item.imagen || "https://via.placeholder.com/150" }}
        style={localStyles.thumbnail}
      />
      <View style={localStyles.info}>
        <Text style={localStyles.title}>{item.titulo}</Text>
        <Text style={localStyles.price}>S/ {item.precio.toFixed(2)}</Text>
      </View>
      {!item.calificado ? (
        <TouchableOpacity
          style={localStyles.reviewButton}
          onPress={() =>
            navigation.navigate("Calificar", { transaction: item })
          }
        >
          <Text style={localStyles.reviewButtonText}>Calificar</Text>
        </TouchableOpacity>
      ) : (
        <Text style={localStyles.doneText}>Reseñado ✓</Text>
      )}
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
          data={purchases}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={
            <Text style={globalStyles.emptyText}>
              Aún no has comprado nada.
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
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
    elevation: 1,
  },
  thumbnail: { width: 50, height: 50, borderRadius: 5 },
  info: { flex: 1, marginLeft: 12 },
  title: { fontWeight: "bold", fontSize: 15 },
  price: { color: COLORS.primary, marginTop: 2 },
  reviewButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reviewButtonText: { color: "#333", fontWeight: "bold" },
  doneText: { color: COLORS.secondary, fontWeight: "bold" },
});

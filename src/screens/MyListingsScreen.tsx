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
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

export default function MyListingsScreen() {
  const [myListings, setMyListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("activo");

  // Estados para el Modal de Selección de Comprador
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [interesadosData, setInteresadosData] = useState<any[]>([]);
  const [loadingInteresados, setLoadingInteresados] = useState(false);

  const fetchMyListings = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "listings"),
        where("vendedor_id", "==", user.uid),
        where("estado", "==", filterStatus),
      );
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMyListings(items);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyListings();
    }, [filterStatus]),
  );

  const openBuyerSelector = async (listing: any) => {
    if (!listing.interesados || listing.interesados.length === 0) {
      Alert.alert(
        "Sin interesados",
        "Nadie ha marcado 'Me interesa' en este anuncio aún.",
      );
      return;
    }
    setSelectedListing(listing);
    setSelectorVisible(true);
    setLoadingInteresados(true);

    try {
      // Obtener nombres de los interesados de la colección 'users'
      const usersInfo = [];
      for (const uid of listing.interesados) {
        const uDoc = await getDoc(doc(db, "users", uid));
        if (uDoc.exists()) usersInfo.push({ id: uid, ...uDoc.data() });
      }
      setInteresadosData(usersInfo);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingInteresados(false);
    }
  };

  const confirmSale = async (compradorId: string) => {
    try {
      await updateDoc(doc(db, "listings", selectedListing.id), {
        estado: "vendido",
        comprador_id: compradorId,
        fecha_venta: new Date().toISOString(),
      });
      setSelectorVisible(false);
      fetchMyListings();
      Alert.alert(
        "¡Venta confirmada!",
        "Ahora el comprador podrá calificar tu servicio.",
      );
    } catch (e) {
      Alert.alert("Error", "No se pudo confirmar la venta.");
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={localStyles.card}>
      <Image
        source={{ uri: item.imagenes?.[0] }}
        style={localStyles.thumbnail}
      />
      <View style={localStyles.info}>
        <Text style={localStyles.title}>{item.titulo}</Text>
        <Text style={localStyles.price}>S/ {item.precio.toFixed(2)}</Text>
      </View>
      {item.estado === "activo" && (
        <TouchableOpacity
          style={localStyles.soldButton}
          onPress={() => openBuyerSelector(item)}
        >
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <Text style={localStyles.soldButtonText}>Vendido</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={globalStyles.container}>
      <View style={localStyles.tabBar}>
        <TouchableOpacity
          style={[
            localStyles.tab,
            filterStatus === "activo" && localStyles.activeTab,
          ]}
          onPress={() => setFilterStatus("activo")}
        >
          <Text
            style={[
              localStyles.tabText,
              filterStatus === "activo" && localStyles.activeTabText,
            ]}
          >
            Activos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            localStyles.tab,
            filterStatus === "vendido" && localStyles.activeTab,
          ]}
          onPress={() => setFilterStatus("vendido")}
        >
          <Text
            style={[
              localStyles.tabText,
              filterStatus === "vendido" && localStyles.activeTabText,
            ]}
          >
            Vendidos
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={myListings}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 15 }}
        />
      )}

      {/* MODAL PARA ELEGIR COMPRADOR */}
      <Modal visible={selectorVisible} animationType="slide" transparent={true}>
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalTitle}>¿Quién lo compró?</Text>
            <Text style={localStyles.modalSubtitle}>
              Selecciona al alumno para que pueda calificarte.
            </Text>

            {loadingInteresados ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <FlatList
                data={interesadosData}
                keyExtractor={(u) => u.id}
                renderItem={({ item: user }) => (
                  <TouchableOpacity
                    style={localStyles.userOption}
                    onPress={() => confirmSale(user.id)}
                  >
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={COLORS.primary}
                    />
                    <Text style={localStyles.userName}>{user.nombre}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={COLORS.textLight}
                    />
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              style={localStyles.cancelButton}
              onPress={() => setSelectorVisible(false)}
            >
              <Text style={localStyles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  tabBar: { flexDirection: "row", backgroundColor: "#fff", elevation: 2 },
  tab: { flex: 1, padding: 15, alignItems: "center" },
  activeTab: { borderBottomWidth: 3, borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.textLight, fontWeight: "bold" },
  activeTabText: { color: COLORS.primary },
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
  price: { color: COLORS.primary },
  soldButton: {
    backgroundColor: COLORS.secondary,
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  soldButtonText: { color: "#fff", fontWeight: "bold", marginLeft: 5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
    maxHeight: "60%",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  modalSubtitle: { color: COLORS.textLight, marginBottom: 20 },
  userOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  userName: { flex: 1, marginLeft: 15, fontSize: 16 },
  cancelButton: { marginTop: 20, padding: 15, alignItems: "center" },
  cancelText: { color: COLORS.danger, fontWeight: "bold" },
});

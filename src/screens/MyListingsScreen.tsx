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
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

export default function MyListingsScreen({ navigation }: any) {
  const [myListings, setMyListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("activo");

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
      setMyListings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
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

  const handleDelete = (id: string) => {
    Alert.alert(
      "Eliminar publicación",
      "¿Estás seguro? Se borrará permanentemente.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await deleteDoc(doc(db, "listings", id));
            fetchMyListings();
          },
        },
      ],
    );
  };

  const toggleStatus = async (item: any) => {
    const newStatus = item.estado === "activo" ? "agotado" : "activo";
    try {
      await updateDoc(doc(db, "listings", item.id), { estado: newStatus });
      fetchMyListings();
    } catch (e) {
      Alert.alert("Error", "No se pudo cambiar el estado.");
    }
  };

  const openBuyerSelector = async (listing: any) => {
    if (!listing.interesados || listing.interesados.length === 0) {
      Alert.alert(
        "Aviso",
        "Aún no tienes posibles compradores registrados en la app.",
      );
      return;
    }
    setSelectedListing(listing);
    setSelectorVisible(true);
    setLoadingInteresados(true);

    try {
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
      await addDoc(collection(db, "transactions"), {
        listing_id: selectedListing.id,
        vendedor_id: selectedListing.vendedor_id,
        comprador_id: compradorId,
        titulo: selectedListing.titulo,
        precio: selectedListing.precio,
        imagen: selectedListing.imagenes?.[0] || "",
        fecha: new Date().toISOString(),
        calificado: false,
      });

      // Lógica de Inteligencia: Si era un artículo único, cerrarlo.
      if (selectedListing.modalidad === "unica") {
        await updateDoc(doc(db, "listings", selectedListing.id), {
          estado: "agotado",
        });
        Alert.alert(
          "Venta completada",
          "Se generó el recibo y tu publicación ha finalizado (pasó a Agotados).",
        );
      } else {
        Alert.alert(
          "Venta registrada",
          "Se generó el recibo. Al ser una oferta múltiple, tu publicación sigue activa.",
        );
      }

      setSelectorVisible(false);
      fetchMyListings();
    } catch (e) {
      Alert.alert("Error", "No se pudo registrar la venta.");
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imagenes?.[0] }} style={styles.thumb} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {item.titulo}
        </Text>
        <Text style={styles.price}>S/ {item.precio.toFixed(2)}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate("EditListing", { listing: item })}
        >
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => toggleStatus(item)}
        >
          <Ionicons
            name={
              item.estado === "activo"
                ? "pause-circle-outline"
                : "play-circle-outline"
            }
            size={20}
            color={COLORS.textLight}
          />
        </TouchableOpacity>
        {item.estado === "activo" && (
          <TouchableOpacity
            style={styles.sellBtn}
            onPress={() => openBuyerSelector(item)}
          >
            <Text style={styles.sellBtnText}>Vender</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={globalStyles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, filterStatus === "activo" && styles.activeTab]}
          onPress={() => setFilterStatus("activo")}
        >
          <Text
            style={[
              styles.tabText,
              filterStatus === "activo" && styles.activeTabText,
            ]}
          >
            Activas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, filterStatus === "agotado" && styles.activeTab]}
          onPress={() => setFilterStatus("agotado")}
        >
          <Text
            style={[
              styles.tabText,
              filterStatus === "agotado" && styles.activeTabText,
            ]}
          >
            Finalizadas
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={myListings}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No hay anuncios en esta sección.
            </Text>
          }
        />
      )}

      <Modal visible={selectorVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Registrar venta</Text>
            <Text style={styles.modalSub}>¿A quién le vendiste?</Text>
            {loadingInteresados ? (
              <ActivityIndicator
                color={COLORS.primary}
                style={{ marginVertical: 20 }}
              />
            ) : (
              <FlatList
                data={interesadosData}
                keyExtractor={(u) => u.id}
                renderItem={({ item: user }) => (
                  <TouchableOpacity
                    style={styles.userOption}
                    onPress={() => confirmSale(user.id)}
                  >
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={COLORS.primary}
                    />
                    <Text style={styles.userName}>{user.nombre}</Text>
                    <Text
                      style={{
                        color: COLORS.secondary,
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      Elegir
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSelectorVisible(false)}
            >
              <Text style={styles.closeBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  tab: { flex: 1, padding: 15, alignItems: "center" },
  activeTab: { borderBottomWidth: 3, borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.textLight, fontWeight: "600", fontSize: 14 },
  activeTabText: { color: COLORS.primary },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    elevation: 2,
  },
  thumb: { width: 55, height: 55, borderRadius: 8 },
  info: { flex: 1, marginLeft: 12 },
  title: { fontWeight: "bold", fontSize: 15, color: COLORS.text },
  price: { color: COLORS.primary, marginTop: 2, fontWeight: "700" },
  actions: { flexDirection: "row", alignItems: "center" },
  iconBtn: { padding: 6, marginLeft: 2 },
  sellBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 5,
  },
  sellBtnText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    maxHeight: "70%",
  },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.text },
  modalSub: { color: COLORS.textMuted, marginVertical: 10, fontSize: 14 },
  userOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  userName: { flex: 1, marginLeft: 15, fontSize: 16, color: COLORS.text },
  closeBtn: { marginTop: 15, alignItems: "center", padding: 10 },
  closeBtnText: { color: COLORS.danger, fontWeight: "bold" },
  emptyText: { textAlign: "center", marginTop: 40, color: COLORS.textLight },
});

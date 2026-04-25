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
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

const { width } = Dimensions.get("window");

export default function ListingDetailScreen({ route, navigation }: any) {
  const { item } = route.params;
  const [vendedor, setVendedor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isInterested, setIsInterested] = useState(false);

  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", item.vendedor_id));
        if (docSnap.exists()) setVendedor(docSnap.data());

        // Verificar si ya estoy en la lista de interesados
        if (item.interesados?.includes(currentUser?.uid)) {
          setIsInterested(true);
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [item]);

  const handleInterest = async () => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, "listings", item.id), {
        interesados: arrayUnion(currentUser.uid),
      });
      setIsInterested(true);
      Alert.alert(
        "Interés registrado",
        "Ahora el vendedor puede confirmarte como comprador para que califiques la venta.",
      );

      // Abrir WhatsApp automáticamente para iniciar el trato
      const msg = `Hola ${vendedor.nombre}, me interesa tu anuncio "${item.titulo}" en UNSA Market.`;
      Linking.openURL(
        `https://wa.me/51${vendedor.whatsapp}?text=${encodeURIComponent(msg)}`,
      );
    } catch (e) {
      Alert.alert("Error", "No se pudo registrar tu interés.");
    }
  };

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveImageIndex(index);
  };

  const isConfirmedBuyer =
    item.estado === "vendido" && item.comprador_id === currentUser?.uid;

  return (
    <ScrollView style={globalStyles.container}>
      <View style={localStyles.galleryContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
        >
          {item.imagenes?.map((img: string, i: number) => (
            <Image
              key={i}
              source={{ uri: img }}
              style={localStyles.mainImage}
            />
          ))}
        </ScrollView>
        {item.imagenes?.length > 1 && (
          <View style={localStyles.pagination}>
            <Text style={localStyles.paginationText}>
              {activeImageIndex + 1} / {item.imagenes.length}
            </Text>
          </View>
        )}
      </View>

      <View style={localStyles.infoBox}>
        <View style={localStyles.statusHeader}>
          <Text style={localStyles.price}>S/ {item.precio.toFixed(2)}</Text>
          {item.estado === "vendido" && (
            <View style={localStyles.soldBadge}>
              <Text style={localStyles.soldText}>VENDIDO</Text>
            </View>
          )}
        </View>

        <Text style={localStyles.title}>{item.titulo}</Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("PublicProfile", {
              vendedorId: item.vendedor_id,
            })
          }
        >
          <Text style={localStyles.sellerLink}>
            <Ionicons name="person-circle-outline" />{" "}
            {vendedor?.nombre || "Cargando..."}
          </Text>
        </TouchableOpacity>

        <View style={localStyles.divider} />
        <Text style={localStyles.sectionLabel}>Descripción</Text>
        <Text style={localStyles.description}>
          {item.descripcion || "Sin descripción adicional."}
        </Text>

        {/* LÓGICA DE BOTONES DE ACCIÓN */}
        {item.estado === "activo" ? (
          <TouchableOpacity
            style={[
              localStyles.actionButton,
              isInterested && { backgroundColor: COLORS.textLight },
            ]}
            onPress={handleInterest}
            disabled={isInterested}
          >
            <Ionicons
              name={
                isInterested
                  ? "checkmark-circle"
                  : "chatbubble-ellipses-outline"
              }
              size={22}
              color="#fff"
            />
            <Text style={localStyles.actionButtonText}>
              {isInterested ? "Interés Enviado" : "Me Interesa / Contactar"}
            </Text>
          </TouchableOpacity>
        ) : isConfirmedBuyer && !item.resena_completada ? (
          <TouchableOpacity
            style={[localStyles.actionButton, { backgroundColor: "#FFD700" }]}
            onPress={() => navigation.navigate("Calificar", { listing: item })}
          >
            <Ionicons name="star" size={22} color="#333" />
            <Text style={[localStyles.actionButtonText, { color: "#333" }]}>
              Calificar esta Compra
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  galleryContainer: { position: "relative" },
  mainImage: { width: width, height: 320, resizeMode: "cover" },
  pagination: {
    position: "absolute",
    bottom: 15,
    right: 15,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  paginationText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  infoBox: { padding: SPACING.lg },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  price: { fontSize: 32, fontWeight: "bold", color: COLORS.primary },
  soldBadge: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
  },
  soldText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  title: {
    fontSize: 22,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: 5,
  },
  sellerLink: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 20,
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 15 },
  sectionLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: COLORS.textMuted,
    lineHeight: 24,
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: COLORS.secondary,
    padding: 18,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 10,
  },
});

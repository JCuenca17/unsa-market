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
  const isOwner = currentUser?.uid === item.vendedor_id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", item.vendedor_id));
        if (docSnap.exists()) setVendedor(docSnap.data());
        if (item.interesados?.includes(currentUser?.uid)) setIsInterested(true);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [item]);

  const handleInterest = async () => {
    if (isOwner) return; // Doble seguridad
    try {
      await updateDoc(doc(db, "listings", item.id), {
        interesados: arrayUnion(currentUser?.uid),
      });
      setIsInterested(true);
      Alert.alert(
        "Interés enviado",
        "El vendedor ya puede verte en su lista para confirmar la venta.",
      );
      Linking.openURL(
        `https://wa.me/51${vendedor.whatsapp}?text=Hola, me interesa tu anuncio: ${item.titulo}`,
      );
    } catch (e) {
      Alert.alert("Error", "No se pudo procesar.");
    }
  };

  return (
    <ScrollView style={globalStyles.container}>
      {/* Galería Profesional */}
      <View style={{ position: "relative" }}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) =>
            setActiveImageIndex(
              Math.round(e.nativeEvent.contentOffset.x / width),
            )
          }
        >
          {item.imagenes?.map((img: string, i: number) => (
            <Image
              key={i}
              source={{ uri: img }}
              style={{ width, height: 350, resizeMode: "cover" }}
            />
          ))}
        </ScrollView>
        <View style={localStyles.badgeContainer}>
          <Text style={localStyles.badgeText}>
            {activeImageIndex + 1} / {item.imagenes?.length}
          </Text>
        </View>
      </View>

      <View style={localStyles.content}>
        <View style={localStyles.priceRow}>
          <Text style={localStyles.price}>S/ {item.precio.toFixed(2)}</Text>
          {item.tipo === "producto" && (
            <Text style={localStyles.stockText}>
              Stock: {item.stock > 0 ? item.stock : "Agotado"}
            </Text>
          )}
        </View>

        {/* REPUTACIÓN DEL VENDEDOR (Detalle Real) */}
        <TouchableOpacity
          style={localStyles.sellerBadge}
          onPress={() =>
            navigation.navigate("PublicProfile", {
              vendedorId: item.vendedor_id,
            })
          }
        >
          <View style={localStyles.avatarSmall}>
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              {vendedor?.nombre?.charAt(0)}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={localStyles.sellerName}>{vendedor?.nombre}</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={localStyles.ratingText}>
                {vendedor?.rating_promedio
                  ? vendedor.rating_promedio.toFixed(1)
                  : "Nuevo"}{" "}
                • {vendedor?.total_ventas || 0} ventas
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>

        <Text style={localStyles.title}>{item.titulo}</Text>
        <View style={localStyles.divider} />

        <Text style={localStyles.labelTitle}>Descripción</Text>
        <Text style={localStyles.description}>
          {item.descripcion || "Sin descripción."}
        </Text>

        {/* LÓGICA DE ACCIÓN PROFESIONAL */}
        {isOwner ? (
          <View style={localStyles.ownerBox}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text style={localStyles.ownerText}>
              Esta es tu publicación. Puedes gestionarla desde tu perfil.
            </Text>
          </View>
        ) : item.estado === "activo" ? (
          <TouchableOpacity
            style={[
              localStyles.mainButton,
              isInterested && { backgroundColor: COLORS.textLight },
            ]}
            onPress={handleInterest}
            disabled={isInterested}
          >
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color="#fff"
              style={{ marginRight: 10 }}
            />
            <Text style={localStyles.mainButtonText}>
              {isInterested ? "Interés Registrado" : "Contactar Vendedor"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View
            style={[localStyles.mainButton, { backgroundColor: COLORS.danger }]}
          >
            <Text style={localStyles.mainButtonText}>ANUNCIO AGOTADO</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  content: { padding: SPACING.lg },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  price: { fontSize: 32, fontWeight: "bold", color: COLORS.text },
  stockText: {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    fontWeight: "bold",
    fontSize: 12,
  },
  sellerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  avatarSmall: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sellerName: { fontWeight: "bold", color: COLORS.text, fontSize: 15 },
  ratingText: { fontSize: 12, color: COLORS.textMuted, marginLeft: 4 },
  title: {
    fontSize: 22,
    color: COLORS.text,
    fontWeight: "500",
    marginBottom: 15,
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 15 },
  labelTitle: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: "bold",
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    color: COLORS.textMuted,
    lineHeight: 24,
    marginBottom: 30,
  },
  mainButton: {
    backgroundColor: COLORS.secondary,
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  mainButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  ownerBox: {
    backgroundColor: "#f0e6ea",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  ownerText: {
    color: COLORS.primary,
    fontSize: 13,
    marginLeft: 10,
    flex: 1,
    fontWeight: "500",
  },
  badgeContainer: {
    position: "absolute",
    bottom: 15,
    right: 15,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
});

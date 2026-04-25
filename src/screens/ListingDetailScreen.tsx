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
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import { COLORS, SPACING } from "../theme/theme";

const { width } = Dimensions.get("window");

export default function ListingDetailScreen({ route }: any) {
  const { item } = route.params;
  const [vendedor, setVendedor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", item.vendedor_id));
        if (docSnap.exists()) setVendedor(docSnap.data());
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSeller();
  }, []);

  const handleContact = () => {
    if (!vendedor?.whatsapp) {
      Alert.alert("Aviso", "El vendedor no tiene WhatsApp registrado.");
      return;
    }
    const msg = `Hola ${vendedor.nombre}, vi tu anuncio "${item.titulo}" en UNSA Market. ¿Sigue disponible?`;
    Linking.openURL(
      `https://wa.me/51${vendedor.whatsapp}?text=${encodeURIComponent(msg)}`,
    );
  };

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveImageIndex(Math.round(index));
  };
  const hasImages = item.imagenes && item.imagenes.length > 0;

  return (
    <ScrollView style={localStyles.container}>
      <View style={localStyles.galleryContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={localStyles.gallery}
        >
          {hasImages ? (
            item.imagenes.map((img: string, i: number) => (
              <Image
                key={i}
                source={{ uri: img }}
                style={localStyles.mainImage}
              />
            ))
          ) : (
            <View style={[localStyles.mainImage, localStyles.noImage]}>
              <Text style={localStyles.noImageText}>Sin imagen</Text>
            </View>
          )}
        </ScrollView>
        {hasImages && item.imagenes.length > 1 && (
          <View style={localStyles.paginationBadge}>
            <Text style={localStyles.paginationText}>
              {activeImageIndex + 1} / {item.imagenes.length}
            </Text>
          </View>
        )}
      </View>

      <View style={localStyles.infoBox}>
        <Text style={localStyles.price}>
          S/ {item.precio ? item.precio.toFixed(2) : "0.00"}
        </Text>
        <Text style={localStyles.title}>{item.titulo}</Text>
        <Text style={localStyles.category}>
          {item.categoria} • {item.tipo}
        </Text>
        <View style={localStyles.divider} />
        <Text style={localStyles.sectionLabel}>Descripción</Text>
        <Text style={localStyles.description}>
          {item.descripcion || "El vendedor no incluyó detalles adicionales."}
        </Text>

        <View style={localStyles.sellerCard}>
          <Text style={localStyles.sectionLabel}>Vendedor</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={localStyles.sellerName}>
              {vendedor?.nombre || "Usuario UNSA"}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={localStyles.whatsappButton}
          onPress={handleContact}
        >
          <Text style={localStyles.whatsappText}>Contactar por WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  galleryContainer: { position: "relative" },
  gallery: { height: 300 },
  mainImage: { width: width, height: 300, resizeMode: "cover" },
  noImage: {
    backgroundColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: { color: COLORS.textLight, fontSize: 16 },
  paginationBadge: {
    position: "absolute",
    bottom: 15,
    right: 15,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  paginationText: { color: COLORS.surface, fontSize: 14, fontWeight: "bold" },
  infoBox: { padding: SPACING.lg },
  price: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  title: { fontSize: 22, color: COLORS.text, marginBottom: SPACING.sm },
  category: {
    color: COLORS.textLight,
    fontWeight: "bold",
    textTransform: "uppercase",
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
  },
  sectionLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: "bold",
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: 16,
    color: COLORS.textMuted,
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  sellerCard: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 10,
    marginBottom: SPACING.lg,
  },
  sellerName: { fontSize: 18, fontWeight: "bold", color: COLORS.text },
  whatsappButton: {
    backgroundColor: COLORS.secondary,
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  whatsappText: { color: COLORS.surface, fontWeight: "bold", fontSize: 16 },
});

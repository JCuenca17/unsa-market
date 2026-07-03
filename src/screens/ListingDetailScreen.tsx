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
import {
  doc,
  getDoc,
  collection,
  query,
  getDocs,
  orderBy,
  limit,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

const { width } = Dimensions.get("window");

export default function ListingDetailScreen({ route, navigation }: any) {
  const { item } = route.params;
  const [vendedor, setVendedor] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInterested, setIsInterested] = useState(false);

  const currentUser = auth.currentUser;
  const isOwner = currentUser?.uid === item.vendedor_id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vSnap = await getDoc(doc(db, "users", item.vendedor_id));
        if (vSnap.exists()) setVendedor(vSnap.data());

        if (item.interesados?.includes(currentUser?.uid)) setIsInterested(true);

        const q = query(
          collection(db, "users", item.vendedor_id, "reviews"),
          orderBy("fecha", "desc"),
          limit(3),
        );
        const rSnap = await getDocs(q);
        setReviews(rSnap.docs.map((d) => d.data()));
      } catch (e) {
        console.log("Error al cargar:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [item]);

  const handleWhatsApp = async () => {
    if (isOwner) return;
    if (!vendedor?.whatsapp) {
      Alert.alert("Error", "El vendedor no registró su WhatsApp.");
      return;
    }
    try {
      if (!isInterested) {
        await updateDoc(doc(db, "listings", item.id), {
          interesados: arrayUnion(currentUser?.uid),
        });
        setIsInterested(true);
      }
      const cleanNumber = vendedor.whatsapp.replace(/\D/g, "");
      const message = `Hola ${vendedor.nombre}, vi tu anuncio "${item.titulo}" en UNSA Market y me interesa.`;
      
      const whatsappUrl = `whatsapp://send?phone=51${cleanNumber}&text=${encodeURIComponent(message)}`;
      const webUrl = `https://wa.me/51${cleanNumber}?text=${encodeURIComponent(message)}`;

      try {
        await Linking.openURL(whatsappUrl);
      } catch (err) {
        // Fallback to web link if WhatsApp deep link is not supported or not installed
        await Linking.openURL(webUrl);
      }
    } catch (e) {
      console.log("Error al abrir WhatsApp:", e);
      Alert.alert("Error", "No se pudo abrir WhatsApp.");
    }
  };

  // LÓGICA DE ESTRELLAS PROFESIONALES
  const renderStars = (rating: number, size: number = 14) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        // Estrella completa
        stars.push(
          <Ionicons key={i} name="star" size={size} color="#FFD700" />,
        );
      } else if (rating >= i - 0.5) {
        // Media estrella
        stars.push(
          <Ionicons key={i} name="star-half" size={size} color="#FFD700" />,
        );
      } else {
        // Estrella vacía
        stars.push(
          <Ionicons key={i} name="star-outline" size={size} color="#FFD700" />,
        );
      }
    }
    return (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {stars}
      </View>
    );
  };

  if (loading)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  return (
    <ScrollView style={{ backgroundColor: "#fff" }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
      >
        {item.imagenes?.map((img: any, i: number) => (
          <Image key={i} source={{ uri: img }} style={{ width, height: 350 }} />
        ))}
      </ScrollView>

      <View style={styles.mainInfo}>
        <View style={styles.priceRow}>
          <Text style={styles.price}>S/ {item.precio.toFixed(2)}</Text>
          <View
            style={[
              styles.modalidadBadge,
              {
                backgroundColor:
                  item.modalidad === "unica" ? "#fff3e0" : "#e3f2fd",
              },
            ]}
          >
            <Text
              style={[
                styles.modalidadText,
                { color: item.modalidad === "unica" ? "#e65100" : "#1565c0" },
              ]}
            >
              {item.modalidad === "unica"
                ? "Artículo Único"
                : "Disponibilidad Múltiple"}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{item.titulo}</Text>

        <TouchableOpacity
          style={styles.sellerRow}
          onPress={() =>
            navigation.navigate("PublicProfile", {
              vendedorId: item.vendedor_id,
            })
          }
        >
          {vendedor?.photoURL ? (
            <Image
              source={{ uri: vendedor.photoURL }}
              style={styles.sellerThumb}
            />
          ) : (
            <View style={styles.sellerThumbPlaceholder}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.sellerName}>{vendedor?.nombre}</Text>
            <View style={styles.statsContainer}>
              {/* Aquí se integra la lógica de estrellas para el rating promedio */}
              {renderStars(vendedor?.rating_promedio || 0, 14)}
              <Text style={styles.sellerStats}>
                {"  "}
                {vendedor?.rating_promedio?.toFixed(1) || "Nuevo"} •{" "}
                {vendedor?.total_ventas || 0} ventas
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.description}>
          {item.descripcion || "El vendedor no proporcionó una descripción."}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Opiniones sobre el vendedor</Text>
        {reviews.length > 0 ? (
          reviews.map((r, index) => (
            <View key={index} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.starsRow}>
                  {/* Aquí se integra la lógica de estrellas para las reseñas individuales */}
                  {renderStars(r.rating, 14)}
                </View>
                <Text style={styles.reviewDate}>
                  {new Date(r.fecha).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.reviewText}>"{r.comentario}"</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noReviews}>Aún no hay reseñas.</Text>
        )}

        {isOwner ? (
          <View style={styles.ownerBox}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.ownerText}>
              Esta es tu publicación. Puedes gestionarla desde tu Perfil.
            </Text>
          </View>
        ) : item.estado === "activo" ? (
          <TouchableOpacity
            style={[
              globalStyles.primaryButton,
              { marginTop: 30, flexDirection: "row", justifyContent: "center" },
            ]}
            onPress={handleWhatsApp}
          >
            <Ionicons
              name="logo-whatsapp"
              size={20}
              color="#fff"
              style={{ marginRight: 10 }}
            />
            <Text style={globalStyles.primaryButtonText}>
              {isInterested ? "Volver a contactar" : "Contactar por WhatsApp"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View
            style={[
              globalStyles.primaryButton,
              { backgroundColor: COLORS.danger, marginTop: 30 },
            ]}
          >
            <Text style={globalStyles.primaryButtonText}>
              ANUNCIO FINALIZADO
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainInfo: { padding: 20 },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  price: { fontSize: 28, fontWeight: "bold", color: COLORS.text },
  modalidadBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  modalidadText: {
    fontWeight: "bold",
    fontSize: 11,
    textTransform: "uppercase",
  },
  title: { fontSize: 20, color: COLORS.textMuted, marginBottom: 15 },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 12,
    marginVertical: 20,
  },
  sellerThumb: { width: 45, height: 45, borderRadius: 23 },
  sellerThumbPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sellerName: { fontWeight: "bold", fontSize: 16 },
  statsContainer: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  sellerStats: { fontSize: 12, color: COLORS.textLight },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: COLORS.text,
  },
  description: { fontSize: 15, color: COLORS.textMuted, lineHeight: 22 },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 25 },
  reviewCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  starsRow: { flexDirection: "row" },
  reviewDate: { fontSize: 11, color: COLORS.textLight },
  reviewText: { fontSize: 13, color: COLORS.textMuted, fontStyle: "italic" },
  noReviews: {
    color: COLORS.textLight,
    fontStyle: "italic",
    fontSize: 13,
    marginBottom: 20,
  },
  ownerBox: {
    backgroundColor: "#f0e6ea",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
  },
  ownerText: {
    color: COLORS.primary,
    fontSize: 13,
    marginLeft: 10,
    flex: 1,
    fontWeight: "500",
  },
});

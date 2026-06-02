// src/screens/ProfileScreen.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image, // <-- 1. Importamos Image de react-native
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

export default function ProfileScreen({ navigation }: any) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    } catch (error) {
      console.log("Error al cargar perfil", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, []),
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log("Error al cerrar sesión", error);
    }
  };

  // LÓGICA DE ESTRELLAS PROFESIONALES
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        // Estrella completa
        stars.push(<Ionicons key={i} name="star" size={20} color="#FFD700" />);
      } else if (rating >= i - 0.5) {
        // Media estrella
        stars.push(
          <Ionicons key={i} name="star-half" size={20} color="#FFD700" />,
        );
      } else {
        // Estrella vacía
        stars.push(
          <Ionicons key={i} name="star-outline" size={20} color="#FFD700" />,
        );
      }
    }
    return <View style={localStyles.starsContainer}>{stars}</View>;
  };

  if (loading) {
    return (
      <View style={globalStyles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const rating = userData?.rating_promedio || 0;

  return (
    <ScrollView contentContainerStyle={globalStyles.containerPadding}>
      <View style={localStyles.profileHeader}>
        {/* 2. Verificamos si existe photoURL para mostrar la imagen o el icono por defecto */}
        {userData?.photoURL ? (
          <Image
            source={{ uri: userData.photoURL }}
            style={localStyles.avatarImage}
          />
        ) : (
          <View style={localStyles.avatarPlaceholder}>
            <Ionicons name="person" size={50} color="#fff" />
          </View>
        )}

        <Text style={localStyles.name}>{userData?.nombre || "Estudiante"}</Text>
        <Text style={localStyles.email}>{userData?.email}</Text>
        <Text style={localStyles.facultad}>
          {userData?.facultad || "Facultad no registrada"}
        </Text>
      </View>

      <View style={localStyles.statsCard}>
        <View style={localStyles.statItem}>
          <Text style={localStyles.statLabel}>Reputación</Text>
          {renderStars(rating)}
          <Text style={localStyles.statNumber}>{rating.toFixed(1)} / 5.0</Text>
        </View>
        <View style={localStyles.divider} />
        <View style={localStyles.statItem}>
          <Text style={localStyles.statLabel}>Ventas</Text>
          <Ionicons
            name="cart-outline"
            size={24}
            color={COLORS.primary}
            style={{ marginVertical: 3 }}
          />
          <Text style={localStyles.statNumber}>
            {userData?.total_ventas || 0} completadas
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={localStyles.menuItem}
        onPress={() => navigation.navigate("EditProfile", { userData })}
      >
        <Ionicons name="create-outline" size={24} color={COLORS.text} />
        <Text style={localStyles.menuText}>Editar Perfil</Text>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
      </TouchableOpacity>

      <TouchableOpacity
        style={localStyles.menuItem}
        onPress={() => navigation.navigate("MisAnuncios")}
      >
        <Ionicons name="pricetags-outline" size={24} color={COLORS.text} />
        <Text style={localStyles.menuText}>Mis Publicaciones</Text>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          localStyles.menuItem,
          { borderColor: "transparent", marginTop: 20 },
        ]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
        <Text style={[localStyles.menuText, { color: COLORS.danger }]}>
          Cerrar Sesión
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  profileHeader: {
    alignItems: "center",
    marginBottom: SPACING.xl,
    marginTop: SPACING.md,
  },
  // 3. Estilo nuevo para la imagen cuando se carga exitosamente
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: SPACING.md,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  name: { fontSize: 24, fontWeight: "bold", color: COLORS.text },
  email: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  facultad: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 4,
    fontWeight: "600",
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statItem: { flex: 1, alignItems: "center" },
  divider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 5,
  },
  starsContainer: { flexDirection: "row", marginVertical: 5 },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuText: {
    flex: 1,
    marginLeft: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
  },
});

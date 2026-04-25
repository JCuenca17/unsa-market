// src/screens/ProfileScreen.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

export default function ProfileScreen({ navigation }: any) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // useFocusEffect recarga los datos cada vez que entras a esta pestaña (ideal por si cambiaste tu foto)
  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        try {
          const docSnap = await getDoc(doc(db, "users", auth.currentUser!.uid));
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        } catch (error) {
          console.error("Error cargando perfil:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    }, []),
  );

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  return (
    <ScrollView style={{ backgroundColor: "#fff" }}>
      <View style={localStyles.header}>
        {userData?.photoURL ? (
          <Image
            source={{ uri: userData.photoURL }}
            style={localStyles.avatar}
          />
        ) : (
          <View
            style={[
              localStyles.avatar,
              {
                backgroundColor: "#eee",
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
          >
            <Ionicons name="person" size={50} color="#ccc" />
          </View>
        )}
        <Text style={localStyles.name}>{userData?.nombre}</Text>
        <Text style={localStyles.sub}>{userData?.email}</Text>
        <Text style={localStyles.faculty}>{userData?.facultad}</Text>
      </View>

      <View style={localStyles.statsContainer}>
        <View style={localStyles.statBox}>
          <Text style={localStyles.statNumber}>
            ⭐ {userData?.rating_promedio?.toFixed(1) || "0.0"}
          </Text>
          <Text style={localStyles.statLabel}>Reputación</Text>
        </View>
        <View style={localStyles.statBox}>
          <Text style={localStyles.statNumber}>
            {userData?.total_ventas || 0}
          </Text>
          <Text style={localStyles.statLabel}>Ventas</Text>
        </View>
      </View>

      <View style={{ padding: SPACING.xl }}>
        {/* BOTÓN PARA CAMBIAR FOTO Y DATOS */}
        <TouchableOpacity
          style={[
            globalStyles.primaryButton,
            {
              marginBottom: 15,
              flexDirection: "row",
              justifyContent: "center",
            },
          ]}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Ionicons
            name="pencil"
            size={20}
            color="#fff"
            style={{ marginRight: 10 }}
          />
          <Text style={globalStyles.primaryButtonText}>
            Editar Perfil y Foto
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            globalStyles.primaryButton,
            { backgroundColor: COLORS.secondary, marginBottom: 15 },
          ]}
          onPress={() => navigation.navigate("MisAnuncios")}
        >
          <Text style={globalStyles.primaryButtonText}>Mis Ventas Activas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            globalStyles.primaryButton,
            { backgroundColor: COLORS.secondary, marginBottom: 30 },
          ]}
          onPress={() => navigation.navigate("MisCompras")}
        >
          <Text style={globalStyles.primaryButtonText}>
            Mis Compras (Recibos)
          </Text>
        </TouchableOpacity>

        {/* BOTÓN DE CERRAR SESIÓN */}
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            padding: 15,
          }}
          onPress={() => signOut(auth)}
        >
          <Ionicons
            name="log-out-outline"
            size={24}
            color={COLORS.danger}
            style={{ marginRight: 10 }}
          />
          <Text
            style={{ color: COLORS.danger, fontWeight: "bold", fontSize: 16 }}
          >
            Cerrar Sesión
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 15 },
  name: { fontSize: 24, fontWeight: "bold", color: COLORS.text },
  sub: { fontSize: 14, color: COLORS.textMuted, marginBottom: 5 },
  faculty: { fontSize: 14, color: COLORS.primary, fontWeight: "600" },
  statsContainer: {
    flexDirection: "row",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    borderRightWidth: 1,
    borderColor: "#eee",
  },
  statNumber: { fontSize: 20, fontWeight: "bold", color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 5 },
});

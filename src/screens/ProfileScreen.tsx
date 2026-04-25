// src/screens/ProfileScreen.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons"; // Librería profesional de iconos
import { db, auth } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

export default function ProfileScreen({ navigation }: any) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  // Usamos useFocusEffect para que los datos se actualicen si volvemos de editar el perfil
  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        if (!currentUser) return;
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error("Error al obtener perfil:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    }, [currentUser]),
  );

  if (loading)
    return (
      <View style={globalStyles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  const MenuItem = ({ icon, title, onPress, isDanger = false }: any) => (
    <TouchableOpacity style={localStyles.menuItem} onPress={onPress}>
      <View style={localStyles.menuItemLeft}>
        <Ionicons
          name={icon}
          size={24}
          color={isDanger ? COLORS.danger : COLORS.primary}
          style={localStyles.menuIcon}
        />
        <Text
          style={[localStyles.menuText, isDanger && { color: COLORS.danger }]}
        >
          {title}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={globalStyles.containerPadding}>
      {/* Cabecera del Perfil */}
      <View style={localStyles.headerContainer}>
        <View style={localStyles.avatarPlaceholder}>
          <Text style={localStyles.avatarText}>
            {userData?.nombre?.charAt(0) || "U"}
          </Text>
        </View>
        <Text style={localStyles.nameText}>
          {userData?.nombre || "Usuario UNSA"}
        </Text>
        <Text style={localStyles.emailText}>{currentUser?.email}</Text>
        {userData?.facultad ? (
          <Text style={localStyles.facultyText}>
            <Ionicons name="school-outline" size={14} /> {userData.facultad}
          </Text>
        ) : null}
      </View>

      {/* Opciones del Dashboard */}
      <View style={localStyles.section}>
        <Text style={localStyles.sectionTitle}>Ventas</Text>
        <MenuItem
          icon="pricetags-outline"
          title="Mis Publicaciones"
          onPress={() => navigation.navigate("MisAnuncios")}
        />
      </View>

      <View style={localStyles.section}>
        <Text style={localStyles.sectionTitle}>Cuenta</Text>
        <MenuItem
          icon="person-outline"
          title="Editar Perfil"
          onPress={() => navigation.navigate("EditProfile", { userData })}
        />
        <MenuItem
          icon="log-out-outline"
          title="Cerrar Sesión"
          isDanger={true}
          onPress={() => signOut(auth)}
        />
      </View>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  headerContainer: {
    alignItems: "center",
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  avatarText: { color: COLORS.surface, fontSize: 36, fontWeight: "bold" },
  nameText: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  emailText: { color: COLORS.textMuted, fontSize: 14, marginBottom: 8 },
  facultyText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "500",
    backgroundColor: "#f0e6ea",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  section: { marginBottom: SPACING.lg },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.xs,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 10,
    marginBottom: SPACING.sm,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  menuItemLeft: { flexDirection: "row", alignItems: "center" },
  menuIcon: { marginRight: SPACING.md },
  menuText: { fontSize: 16, fontWeight: "500", color: COLORS.text },
});

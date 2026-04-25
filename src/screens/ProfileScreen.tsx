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

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        try {
          const docSnap = await getDoc(doc(db, "users", auth.currentUser!.uid));
          if (docSnap.exists()) setUserData(docSnap.data());
        } catch (e) {
          console.log(e);
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
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {/* BOTÓN DE EDICIÓN FLOTANTE SOBRE LA FOTO */}
        <View style={styles.avatarWrapper}>
          {userData?.photoURL ? (
            <Image source={{ uri: userData.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={50} color={COLORS.textLight} />
            </View>
          )}
          <TouchableOpacity
            style={styles.editIconBadge}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Ionicons name="pencil" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>{userData?.nombre}</Text>
        <Text style={styles.faculty}>{userData?.facultad}</Text>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>
            {userData?.rating_promedio?.toFixed(1) || "0.0"}
          </Text>
          <Text style={styles.statLabel}>Reputación</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{userData?.total_ventas || 0}</Text>
          <Text style={styles.statLabel}>Ventas</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("MisAnuncios")}
        >
          <Ionicons name="pricetags-outline" size={22} color={COLORS.primary} />
          <Text style={styles.menuText}>Gestionar mis publicaciones</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("MisCompras")}
        >
          <Ionicons name="receipt-outline" size={22} color={COLORS.primary} />
          <Text style={styles.menuText}>Historial de compras</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { marginTop: 30 }]}
          onPress={() => signOut(auth)}
        >
          <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
          <Text style={[styles.menuText, { color: COLORS.danger }]}>
            Cerrar Sesión
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#fcfcfc",
  },
  avatarWrapper: { position: "relative" },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  editIconBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: { fontSize: 24, fontWeight: "bold", color: COLORS.text, marginTop: 15 },
  faculty: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  statsBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
    paddingVertical: 20,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    borderRightWidth: 1,
    borderColor: "#f0f0f0",
  },
  statVal: { fontSize: 20, fontWeight: "bold", color: COLORS.text },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    textTransform: "uppercase",
  },
  menu: { padding: 20 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f9f9f9",
  },
  menuText: { flex: 1, marginLeft: 15, fontSize: 16, color: COLORS.text },
});

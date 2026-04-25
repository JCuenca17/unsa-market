// src/navigation/AppNavigator.tsx
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../services/firebaseConfig";
import { COLORS } from "../theme/theme";

// Pantallas
import LoginScreen from "../screens/LoginScreen";
import CompleteProfileScreen from "../screens/CompleteProfileScreen";
import HomeScreen from "../screens/HomeScreen";
import ListingDetailScreen from "../screens/ListingDetailScreen";
import ProfileScreen from "../screens/ProfileScreen";
import MyListingsScreen from "../screens/MyListingsScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import CreateListingScreen from "../screens/CreateListingScreen";
import PublicProfileScreen from "../screens/PublicProfileScreen";
import ReviewScreen from "../screens/ReviewScreen";
import MyPurchasesScreen from "../screens/MyPurchasesScreen";
import EditListingScreen from "../screens/EditListingScreen"; // <-- RUTA CORREGIDA

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: { height: 65, paddingBottom: 10, paddingTop: 10 },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          if (route.name === "Inicio")
            iconName = focused ? "home" : "home-outline";
          else if (route.name === "Mi Perfil")
            iconName = focused ? "person" : "person-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Mi Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        unsubscribeDoc = onSnapshot(
          doc(db, "users", currentUser.uid),
          (docSnap) => {
            setIsProfileComplete(
              docSnap.exists() && docSnap.data().perfil_completado === true,
            );
            setLoading(false);
          },
        );
      } else {
        if (unsubscribeDoc) unsubscribeDoc();
        setLoading(false);
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  return (
    <NavigationContainer>
      {!user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      ) : !isProfileComplete ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="CompleteProfile"
            component={CompleteProfileScreen}
          />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ListingDetail"
            component={ListingDetailScreen}
            options={{ title: "Detalle" }}
          />
          <Stack.Screen
            name="MisAnuncios"
            component={MyListingsScreen}
            options={{ title: "Mis Ventas" }}
          />
          <Stack.Screen
            name="MisCompras"
            component={MyPurchasesScreen}
            options={{ title: "Mis Compras" }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ title: "Editar Perfil" }}
          />
          <Stack.Screen
            name="EditListing"
            component={EditListingScreen}
            options={{ title: "Editar Anuncio" }}
          />
          <Stack.Screen
            name="Publicar"
            component={CreateListingScreen}
            options={{ title: "Vender" }}
          />
          <Stack.Screen
            name="PublicProfile"
            component={PublicProfileScreen}
            options={{ title: "Perfil del Vendedor" }}
          />
          <Stack.Screen
            name="Calificar"
            component={ReviewScreen}
            options={{ title: "Reseña" }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

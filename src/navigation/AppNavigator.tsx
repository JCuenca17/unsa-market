// src/navigation/AppNavigator.tsx
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text, ActivityIndicator } from "react-native";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../services/firebaseConfig";

import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import CreateListingScreen from "../screens/CreateListingScreen";
import ListingDetailScreen from "../screens/ListingDetailScreen";
import ProfileScreen from "../screens/ProfileScreen";
import MyListingsScreen from "../screens/MyListingsScreen";
import EditListingScreen from "../screens/EditListingScreen";
import EditProfileScreen from "../screens/EditProfileScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Las pestañas inferiores se agrupan en su propio componente
function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: "#5A0028" }}>
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Publicar" component={CreateListingScreen} />
      <Tab.Screen name="Mi Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#5A0028" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        // Usamos el Stack Navigator como contenedor principal cuando hay sesión
        <Stack.Navigator>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ListingDetail"
            component={ListingDetailScreen}
            options={{ title: "Detalles del Anuncio" }}
          />
          <Stack.Screen
            name="MisAnuncios"
            component={MyListingsScreen}
            options={{ title: "Mis Publicaciones" }}
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
        </Stack.Navigator>
      ) : (
        <LoginScreen />
      )}
    </NavigationContainer>
  );
}

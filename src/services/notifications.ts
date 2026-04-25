// src/services/notifications.ts
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

Notifications.setNotificationHandler({
  handleNotification: async (
    notification: Notifications.Notification,
  ): Promise<Notifications.NotificationBehavior> => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(userId: string) {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("Permiso denegado para notificaciones push");
      return;
    }

    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;
      // En Expo Go (SDK 53+) esto lanzará un error interno, lo atrapamos con el try/catch
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

      if (token && userId) {
        await updateDoc(doc(db, "users", userId), {
          expoPushToken: token,
        });
      }
    } catch (error) {
      // 2. FIX DE EXPO GO: Atrapamos el error silenciosamente para que la app siga funcionando
      console.log(
        "Aviso: Las notificaciones Push remotas requieren un Development Build. El token no se guardó en Expo Go.",
      );
    }
  } else {
    console.log(
      "Debes usar un dispositivo físico para las notificaciones Push",
    );
  }

  return token;
}

export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
) {
  if (!expoPushToken) return;

  const message = {
    to: expoPushToken,
    sound: "default",
    title: title,
    body: body,
    data: { ruta: "MisAnuncios" },
  };

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.log("Error enviando notificación:", error);
  }
}

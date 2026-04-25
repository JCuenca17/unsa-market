// src/services/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Deberás reemplazar estos valores con los de tu proyecto de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDuXEzBR1gS7cKrIbjaFJ37cJXupmtdLqQ",
  authDomain: "unsa-market.firebaseapp.com",
  projectId: "unsa-market",
  storageBucket: "unsa-market.firebasestorage.app",
  messagingSenderId: "498555781389",
  appId: "1:498555781389:web:77d2b2344c87978ffb7044",
};
// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar las instancias para usarlas en otras partes de la app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

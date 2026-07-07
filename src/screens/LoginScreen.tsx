// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  signInAnonymously, // <-- IMPORTACIÓN AÑADIDA
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../services/firebaseConfig";
import { globalStyles, COLORS, SPACING } from "../theme/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Estados para Términos y Condiciones
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  // <-- FUNCIÓN DE INVITADO AÑADIDA -->
  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo acceder como invitado. Verifica tu conexión a internet.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      Alert.alert(
        "Correo necesario",
        "Por favor, escribe tu correo institucional en el campo de arriba y vuelve a presionar este botón para enviarte el enlace de recuperación.",
      );
      return;
    }
    if (!cleanEmail.endsWith("@unsa.edu.pe")) {
      Alert.alert(
        "Correo inválido",
        "Debes ingresar un correo institucional válido (@unsa.edu.pe).",
      );
      return;
    }
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      Alert.alert(
        "Enlace enviado",
        "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa también tu carpeta de SPAM.",
      );
    } catch (error: any) {
      Alert.alert(
        "Aviso",
        "Se ha procesado tu solicitud. Si el correo existe en nuestro sistema, recibirás las instrucciones.",
      );
    }
  };

  const handleAuth = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password || (!isLogin && !confirmPassword)) {
      Alert.alert(
        "Campos incompletos",
        "Por favor, completa todos los datos solicitados.",
      );
      return;
    }
    if (!cleanEmail.endsWith("@unsa.edu.pe")) {
      Alert.alert(
        "Acceso Restringido",
        "El sistema es exclusivo para correos institucionales (@unsa.edu.pe).",
      );
      return;
    }

    if (!isLogin) {
      if (!acceptTerms) {
        Alert.alert(
          "Términos Requeridos",
          "Debes leer y aceptar los Términos y Condiciones de Uso para poder registrarte en la plataforma.",
        );
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert(
          "Discrepancia en contraseñas",
          "Las contraseñas ingresadas no coinciden. Por favor, verifícalas.",
        );
        return;
      }
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
      if (!passwordRegex.test(password)) {
        Alert.alert(
          "Contraseña vulnerable",
          "Asegúrate de que tu contraseña cumpla con todos los requisitos de seguridad detallados en la pantalla.",
        );
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password,
        );
        const user = userCredential.user;

        if (!user.emailVerified) {
          await signOut(auth);
          Alert.alert(
            "Cuenta inactiva",
            "Tu correo aún no ha sido verificado. Revisa tu bandeja de entrada o la carpeta de SPAM y haz clic en el enlace de activación.",
            [
              {
                text: "Reenviar enlace",
                onPress: () => sendEmailVerification(user),
              },
              { text: "Entendido" },
            ],
          );
          setLoading(false);
          return;
        }

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            email: user.email,
            nombre: cleanEmail.split("@")[0],
            whatsapp: "",
            facultad: "",
            rating_promedio: 0,
            total_ventas: 0,
            perfil_completado: false,
            fecha_registro: new Date().toISOString(),
          });
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password,
        );
        const user = userCredential.user;

        await sendEmailVerification(user);

        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          nombre: cleanEmail.split("@")[0],
          whatsapp: "",
          facultad: "",
          rating_promedio: 0,
          total_ventas: 0,
          perfil_completado: false,
          fecha_registro: new Date().toISOString(),
          terminos_aceptados: true,
          fecha_aceptacion_terminos: new Date().toISOString(),
          version_terminos: "1.0",
        });

        await signOut(auth);

        Alert.alert(
          "¡Registro completado!",
          "Solo falta un paso. Hemos enviado un enlace de confirmación a tu correo institucional. Ábrelo para activar tu cuenta.",
        );
        setIsLogin(true);
        setPassword("");
        setConfirmPassword("");
        setShowPassword(false);
        setShowConfirmPassword(false);
        setAcceptTerms(false);
      }
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        Alert.alert(
          "Registro denegado",
          "Este correo institucional ya tiene una cuenta activa. Ve a iniciar sesión.",
        );
      } else if (error.code === "auth/invalid-credential") {
        Alert.alert(
          "Credenciales incorrectas",
          "El correo ingresado no existe o la contraseña es incorrecta.",
        );
      } else if (error.code === "auth/too-many-requests") {
        Alert.alert(
          "Seguridad activada",
          "Demasiados intentos fallidos. Por protección, tu cuenta ha sido bloqueada temporalmente.",
        );
      } else {
        Alert.alert(
          "Error del servidor",
          "No se pudo conectar. Verifica tu conexión a internet e intenta de nuevo.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={localStyles.mainContainer}>
              <View style={localStyles.logoSection}>
                <Ionicons
                  name="shield-checkmark"
                  size={80}
                  color={COLORS.primary}
                />
                <Text style={localStyles.appName}>UNSA Market</Text>
                <Text style={localStyles.tagline}>
                  Acceso seguro para la comunidad universitaria.
                </Text>
              </View>

              <View style={localStyles.formContainer}>
                <Text style={globalStyles.label}>
                  Correo Electrónico Institucional
                </Text>
                <TextInput
                  style={globalStyles.input}
                  placeholder="ejemplo@unsa.edu.pe"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={globalStyles.label}>Contraseña</Text>
                <View
                  style={[
                    localStyles.inputWrapper,
                    { marginBottom: isLogin ? SPACING.xs : 5 },
                  ]}
                >
                  <TextInput
                    style={[
                      globalStyles.input,
                      { paddingRight: 50, marginBottom: 0 },
                    ]}
                    placeholder={
                      isLogin ? "Tu contraseña" : "Crea una contraseña robusta"
                    }
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={localStyles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={22}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                {isLogin && (
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    style={localStyles.forgotPasswordButton}
                  >
                    <Text style={localStyles.forgotPasswordText}>
                      ¿Olvidaste tu contraseña?
                    </Text>
                  </TouchableOpacity>
                )}

                {!isLogin && (
                  <View style={localStyles.requirementsContainer}>
                    <Text style={localStyles.requirementText}>
                      Requisitos obligatorios:
                    </Text>
                    <Text style={localStyles.requirementItem}>
                      • Mínimo 8 caracteres de longitud.
                    </Text>
                    <Text style={localStyles.requirementItem}>
                      • Al menos una letra{" "}
                      <Text style={{ fontWeight: "bold" }}>mayúscula</Text> y
                      una <Text style={{ fontWeight: "bold" }}>minúscula</Text>.
                    </Text>
                    <Text style={localStyles.requirementItem}>
                      • Al menos un{" "}
                      <Text style={{ fontWeight: "bold" }}>número</Text>.
                    </Text>
                    <Text style={localStyles.requirementItem}>
                      • Al menos un{" "}
                      <Text style={{ fontWeight: "bold" }}>símbolo</Text> (ej.
                      @, $, !, %, *, ?, &).
                    </Text>
                  </View>
                )}

                {!isLogin && (
                  <>
                    <Text style={globalStyles.label}>Confirmar Contraseña</Text>
                    <View style={localStyles.inputWrapper}>
                      <TextInput
                        style={[
                          globalStyles.input,
                          { paddingRight: 50, marginBottom: 0 },
                        ]}
                        placeholder="Repite tu contraseña exactamente igual"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                      />
                      <TouchableOpacity
                        style={localStyles.eyeIcon}
                        onPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        <Ionicons
                          name={showConfirmPassword ? "eye-off" : "eye"}
                          size={22}
                          color={COLORS.textMuted}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={localStyles.termsContainer}>
                      <TouchableOpacity
                        onPress={() => setAcceptTerms(!acceptTerms)}
                        style={localStyles.checkbox}
                      >
                        <Ionicons
                          name={acceptTerms ? "checkbox" : "square-outline"}
                          size={24}
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>
                      <Text style={localStyles.termsText}>
                        He leído y acepto los{" "}
                        <Text
                          style={localStyles.termsLink}
                          onPress={() => setTermsModalVisible(true)}
                        >
                          Términos y Condiciones
                        </Text>
                      </Text>
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={[
                    globalStyles.primaryButton,
                    { marginTop: isLogin ? 15 : 10 },
                  ]}
                  onPress={handleAuth}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={globalStyles.primaryButtonText}>
                      {isLogin ? "Ingresar al Marketplace" : "Registrarme"}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* <-- BOTÓN DE INVITADO AÑADIDO --> */}
                <TouchableOpacity
                  onPress={handleGuestLogin}
                  style={{ marginTop: 20, alignItems: "center" }}
                  disabled={loading}
                >
                  <Text
                    style={{
                      color: COLORS.textLight,
                      fontSize: 14,
                      textDecorationLine: "underline",
                    }}
                  >
                    Explorar catálogo como invitado
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setIsLogin(!isLogin);
                    setPassword("");
                    setConfirmPassword("");
                    setShowPassword(false);
                    setShowConfirmPassword(false);
                    setAcceptTerms(false);
                  }}
                  style={{ marginTop: 25, alignItems: "center" }}
                >
                  <Text
                    style={{
                      color: COLORS.primary,
                      fontWeight: "bold",
                      fontSize: 15,
                    }}
                  >
                    {isLogin
                      ? "¿Nuevo en UNSA Market? Crea tu cuenta"
                      : "¿Ya eres miembro? Inicia sesión"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={termsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalMainTitle}>
              Términos y Condiciones
            </Text>
            <ScrollView style={localStyles.modalScroll}>
              <Text style={localStyles.modalText}>
                <Text style={{ fontWeight: "bold" }}>
                  TÉRMINOS Y CONDICIONES DE USO DE UNSA MARKET
                </Text>
                {"\n"}
                Fecha de última actualización: 06 de Julio de 2026{"\n\n"}
                {/* ... AQUÍ VA EL RESTO DEL TEXTO LEGAL QUE YA TENÍAS ... */}
                (El contenido de los términos está en tu código actual, mantenlo
                aquí)
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={localStyles.closeModalBtn}
              onPress={() => {
                setTermsModalVisible(false);
                setAcceptTerms(true);
              }}
            >
              <Text style={localStyles.closeModalBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const localStyles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  logoSection: { alignItems: "center", marginBottom: 35 },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 10,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 20,
  },
  formContainer: { width: "100%" },
  inputWrapper: { position: "relative", justifyContent: "center" },
  eyeIcon: {
    position: "absolute",
    right: 15,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginBottom: SPACING.md,
    marginTop: 5,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  requirementsContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  requirementText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  requirementItem: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 2,
    paddingLeft: 4,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 10,
  },
  checkbox: {
    marginRight: 10,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    height: "80%",
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  modalMainTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 15,
    textAlign: "center",
  },
  modalScroll: {
    marginBottom: 15,
  },
  modalText: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 22,
    textAlign: "justify",
  },
  closeModalBtn: {
    alignSelf: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  closeModalBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

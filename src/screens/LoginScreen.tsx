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
  signInAnonymously,
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
          // Actualizamos la versión de los términos al cambiar la política de fotos
          version_terminos: "1.1",
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
                <Text style={{ fontWeight: "bold" }}>1. Introducción</Text>
                {"\n"}
                Bienvenido/a a UNSA Market. El presente documento establece los
                Términos y Condiciones que regulan el acceso y uso de la
                aplicación móvil UNSA Market (en adelante, "la Aplicación" o "la
                Plataforma"). Al registrarse, acceder o utilizar la Aplicación,
                el usuario acepta de manera expresa, voluntaria e inequívoca
                someterse a los presentes Términos y Condiciones.{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>
                  2. Objeto de los Términos y Condiciones
                </Text>
                {"\n"}
                El objeto de este documento es definir las reglas, derechos,
                obligaciones y limitaciones de responsabilidad aplicables al uso
                de la Aplicación, la cual funciona como un directorio virtual y
                tablón de anuncios clasificados destinado exclusivamente a la
                comunidad universitaria.{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>
                  3. Alcance del Servicio
                </Text>
                {"\n"}
                UNSA Market proporciona una plataforma tecnológica que permite a
                los usuarios publicar anuncios de compra y venta de productos
                (ej. libros, tecnología, ropa) y servicios (ej. tutorías,
                asesorías). La Aplicación no interviene en las transacciones.
                UNSA Market no es propietario de los artículos ofrecidos, no los
                tiene en posesión, no procesa transacciones económicas, ni
                participa en la entrega de bienes o prestación de servicios. El
                servicio se limita a facilitar el contacto entre usuarios
                mediante la integración con aplicaciones de mensajería de
                terceros (WhatsApp).{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>
                  4. Requisitos para Utilizar la Aplicación
                </Text>
                {"\n"}
                Para utilizar UNSA Market, el usuario debe cumplir
                obligatoriamente con los siguientes requisitos:{"\n"}• Ser
                miembro activo de la comunidad universitaria.{"\n"}• Poseer y
                registrarse con una dirección de correo electrónico
                institucional válida que termine con el dominio @unsa.edu.pe.
                {"\n"}• Proveer un número de WhatsApp activo y verídico, así
                como indicar su Facultad o Escuela.{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>
                  5. Registro y Creación de Cuentas
                </Text>
                {"\n"}
                El registro en la plataforma requiere la validación de la
                identidad mediante el envío de un enlace al correo
                institucional. Al crear una cuenta, el usuario garantiza que:
                {"\n"}• La información proporcionada (correo, número de
                WhatsApp, Facultad) es exacta, actual y verdadera.{"\n"}•
                Mantendrá la confidencialidad de su contraseña. El usuario es el
                único responsable de todas las actividades que ocurran bajo su
                cuenta.{"\n"}• No creará múltiples cuentas para eludir
                suspensiones o manipular el sistema de calificaciones.{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>
                  6. Derechos y Obligaciones del Usuario
                </Text>
                {"\n"}
                El usuario tiene derecho a:{"\n"}• Publicar anuncios de
                productos y servicios permitidos.{"\n"}• Contactar a otros
                usuarios para negociar transacciones.{"\n"}• Calificar y dejar
                reseñas sobre otros usuarios tras una interacción.{"\n\n"}
                El usuario se obliga a:{"\n"}• Utilizar la plataforma de buena
                fe y con respeto hacia otros miembros de la comunidad
                universitaria.{"\n"}• Publicar descripciones precisas y
                fotografías reales de los productos o servicios ofrecidos.{"\n"}
                • Cumplir con los acuerdos pactados con otros usuarios
                (encuentros, pagos, entregas).{"\n"}• No utilizar la plataforma
                para actividades ilegales, fraudulentas, o que vulneren el honor
                de terceros.{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>
                  7. Uso Permitido y Uso Prohibido de la Plataforma
                </Text>
                {"\n"}
                Queda estrictamente prohibido publicar anuncios relacionados
                con:{"\n"}• Bienes robados, ilegales o de contrabando.{"\n"}•
                Sustancias ilícitas, drogas, alcohol, tabaco o medicamentos
                controlados.{"\n"}• Armas de cualquier tipo.{"\n"}• Servicios
                que vulneren la integridad académica (ej. suplantación en
                exámenes, compra/venta de tesis o trabajos académicos que violen
                normativas universitarias).{"\n"}• Contenido explícito,
                discriminatorio, ofensivo o que incite al odio.{"\n\n"}
                El incumplimiento de esta cláusula conllevará la eliminación
                inmediata del anuncio y la posible suspensión de la cuenta.
                {"\n\n"}
                <Text style={{ fontWeight: "bold" }}>
                  8. Sistema de Reseñas y Calificaciones
                </Text>
                {"\n"}
                La Aplicación cuenta con un sistema de reseñas basado en
                estrellas y comentarios. El usuario se compromete a emitir
                calificaciones basadas en experiencias reales y de forma
                objetiva. El propietario de la Aplicación se reserva el derecho
                de eliminar reseñas que contengan lenguaje ofensivo, amenazas o
                que sean identificadas como falsas (spam o manipulación de
                reputación).{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>
                  9. Tratamiento de Datos Personales
                </Text>
                {"\n"}
                <Text style={{ fontWeight: "bold" }}>
                  9.1. Información recopilada:
                </Text>{" "}
                La Aplicación recopila información personal de forma directa
                (correo institucional, nombre derivado del correo, número de
                WhatsApp, Facultad/Escuela, fotografías subidas) y de forma
                automática (fecha de registro, historial de publicaciones,
                interacciones de contacto, calificaciones recibidas, y tokens de
                dispositivos para notificaciones Push).{"\n"}
                <Text style={{ fontWeight: "bold" }}>
                  9.2. Finalidad del tratamiento:
                </Text>{" "}
                Los datos son utilizados exclusivamente para:{"\n"}• Validar la
                pertenencia a la comunidad universitaria.{"\n"}• Facilitar el
                contacto directo entre comprador y vendedor vía WhatsApp.{"\n"}•
                Administrar el perfil del usuario y el historial de
                transacciones.{"\n"}• Enviar notificaciones operativas.{"\n"}
                {/* ESTA ES LA SECCIÓN 9.3 ACTUALIZADA CON IMGBB */}
                <Text style={{ fontWeight: "bold" }}>9.3. Terceros:</Text> La
                plataforma utiliza la infraestructura de Firebase (Google) y
                Expo para el procesamiento y almacenamiento general de datos.
                Asimismo, para optimizar el rendimiento de la Aplicación, las
                fotografías subidas por los usuarios (fotos de perfil y
                anuncios) son procesadas y alojadas mediante servicios de
                alojamiento de imágenes de terceros (como ImgBB o similares).
                Los datos no son vendidos, alquilados ni compartidos con
                terceros con fines publicitarios ajenos al funcionamiento de la
                App.{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>
                  10. Confidencialidad y Seguridad de la Información
                </Text>
                {"\n"}
                El propietario de la Aplicación adopta medidas técnicas
                razonables (como la encriptación de contraseñas mediante
                Firebase Auth) para proteger los datos de los usuarios. Sin
                embargo, al ser una plataforma comunitaria de contacto, el
                número de WhatsApp y la Facultad del usuario serán visibles para
                aquellos que muestren interés en sus anuncios. El usuario acepta
                esta exposición inherente a la naturaleza del servicio.{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>
                  11. Limitación de Responsabilidad
                </Text>
                {"\n"}
                Al no participar en la transacción final, el propietario de UNSA
                Market no se hace responsable por:{"\n"}• La calidad, seguridad,
                legalidad o estado de los artículos publicados.{"\n"}• La
                veracidad de las descripciones o las identidades reales de los
                usuarios más allá de la validación del dominio institucional.
                {"\n"}• Cualquier pérdida económica, daño, fraude, estafa o
                incidente derivado de los encuentros presenciales o
                transacciones pactadas a través de la Aplicación.{"\n"}• El
                contenido de los mensajes intercambiados a través de WhatsApp.
                {"\n"}
                Se recomienda a los usuarios realizar las entregas en lugares
                públicos dentro del campus universitario y verificar los
                artículos antes de realizar cualquier pago.{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>
                  12. Disponibilidad del Servicio y Modificaciones
                </Text>
                {"\n"}
                La Aplicación se ofrece "tal cual" y "según disponibilidad". El
                propietario no garantiza que el servicio sea ininterrumpido o
                libre de errores (caídas de servidor, fallos en bases de datos).
                Asimismo, el propietario se reserva el derecho de modificar,
                suspender o discontinuar cualquier funcionalidad de la
                Aplicación en cualquier momento.{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>
                  13. Suspensión o Cancelación de Cuentas
                </Text>
                {"\n"}
                El administrador de la plataforma se reserva el derecho de
                suspender o eliminar definitivamente, sin previo aviso, la
                cuenta de cualquier usuario que incumpla estos Términos y
                Condiciones, acumule quejas reiteradas o afecte negativamente a
                la comunidad universitaria.{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>
                  14. Modificaciones de los Términos y Condiciones
                </Text>
                {"\n"}
                Estos términos pueden ser actualizados. Los cambios
                significativos serán notificados a los usuarios a través de la
                Aplicación o mediante correo electrónico. El uso continuado de
                la Aplicación tras la modificación constituye la aceptación de
                los nuevos términos.{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>
                  15. Legislación Aplicable y Jurisdicción
                </Text>
                {"\n"}
                Los presentes Términos y Condiciones se regirán e interpretarán
                de acuerdo con las leyes de la República del Perú. Cualquier
                controversia derivada del uso de la Aplicación se someterá a la
                jurisdicción de los tribunales competentes de la ciudad de
                Arequipa.{"\n\n"}
                <Text style={{ fontWeight: "bold" }}>
                  16. Información de Contacto
                </Text>
                {"\n"}
                Para consultas, reportes de usuarios o dudas sobre estos
                Términos y Condiciones, puede contactar a la administración a
                través del correo electrónico: androiddevnove@gmail.com.
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

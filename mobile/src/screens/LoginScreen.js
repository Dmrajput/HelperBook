import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../components/AppText";
import BrandLogo from "../components/BrandLogo";
import { LOGIN_HEADLINE } from "../constants/app";
import { useAuth } from "../context/AuthContext";
import { colors, spacing } from "../theme";

function validateMobile(value) {
  if (!value) {
    return "Enter your mobile number.";
  }
  if (!/^[6-9]\d{9}$/.test(value)) {
    return "Enter a valid 10-digit mobile number.";
  }
  return "";
}

function validatePassword(value) {
  if (!value) {
    return "Enter your password.";
  }
  return "";
}

function HeroIllustration() {
  return (
    <View style={styles.heroArt} pointerEvents="none">
      <View style={[styles.artBubble, styles.artBubbleBack]} />
      <View style={[styles.artBubble, styles.artBubbleMid]}>
        <Ionicons name="calendar-outline" size={22} color={colors.primary} />
      </View>
      <LinearGradient
        colors={["#A5B4FC", "#6366F1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.artBubble, styles.artBubbleFront]}
      >
        <Ionicons name="person" size={26} color={colors.textInverse} />
      </LinearGradient>
      <View style={styles.artBadge}>
        <Ionicons name="checkmark-circle" size={18} color={colors.success} />
      </View>
    </View>
  );
}

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChangeMobileNumber = (value) => {
    setMobileNumber(value.replace(/\D/g, "").slice(0, 10));
  };

  const onLogin = async () => {
    const validationMessage = validateMobile(mobileNumber) || validatePassword(password);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login({ phoneNumber: mobileNumber, password });
    } catch (requestError) {
      setError(requestError?.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#EEF2FF", "#F8FAFC", "#FFFFFF"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.wave, styles.waveOne]} />
      <View style={[styles.wave, styles.waveTwo]} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View style={styles.brandCopy}>
            <BrandLogo size={72} style={styles.brandLogo} />
            <AppText variant="caption" color={colors.textSecondary} style={styles.tagline}>
              {LOGIN_HEADLINE}
            </AppText>
          </View>
          <HeroIllustration />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AppText variant="heading" style={styles.welcomeTitle}>
              Welcome back
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Sign in to continue
            </AppText>
          </View>

          <View style={styles.fieldGroup}>
            <AppText variant="label" style={styles.fieldLabel}>
              Mobile Number
            </AppText>
            <View style={styles.phoneField}>
              <View style={styles.codeBox}>
                <AppText variant="button" style={styles.codeText}>
                  +91
                </AppText>
              </View>
              <View style={styles.phoneDivider} />
              <TextInput
                value={mobileNumber}
                onChangeText={onChangeMobileNumber}
                placeholder="Enter mobile number"
                placeholderTextColor={colors.placeholder}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!loading}
                onSubmitEditing={onLogin}
                style={styles.input}
                accessibilityLabel="Mobile number"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <AppText variant="label" style={styles.fieldLabel}>
              Password
            </AppText>
            <View style={styles.passwordField}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                onSubmitEditing={onLogin}
                style={styles.input}
                accessibilityLabel="Password"
              />
              <Pressable
                onPress={() => setShowPassword((current) => !current)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                hitSlop={8}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.placeholder}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => navigation.navigate("ForgotPassword")}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Forgot password"
            style={styles.forgotRow}
          >
            <AppText variant="caption" color={colors.primary} style={styles.forgotText}>
              Forgot password?
            </AppText>
          </Pressable>

          {error ? (
            <AppText variant="caption" color={colors.error} style={styles.errorText}>
              {error}
            </AppText>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log in"
            accessibilityState={{ disabled: loading, busy: loading }}
            disabled={loading}
            onPress={onLogin}
            style={({ pressed }) => [styles.loginPressable, pressed && !loading && styles.pressed]}
          >
            <LinearGradient
              colors={loading ? [colors.disabled, colors.disabled] : ["#818CF8", "#6366F1", "#4F46E5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButton}
            >
              <AppText variant="button" color={loading ? colors.disabledText : colors.textInverse}>
                {loading ? "Signing in..." : "Log in"}
              </AppText>
              {!loading ? <Ionicons name="arrow-forward" size={18} color={colors.textInverse} /> : null}
            </LinearGradient>
          </Pressable>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <AppText variant="caption" color={colors.placeholder} style={styles.orText}>
              or
            </AppText>
            <View style={styles.orLine} />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create account"
            disabled={loading}
            onPress={() => navigation.navigate("Register")}
            style={({ pressed }) => [
              styles.createButton,
              pressed && !loading && styles.pressed,
              loading && styles.createDisabled,
            ]}
          >
            <AppText variant="button" color={loading ? colors.disabledText : colors.primary}>
              Create account
            </AppText>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Employee login"
          disabled={loading}
          onPress={() => navigation.navigate("EmployeeLogin")}
          style={({ pressed }) => [styles.employeeBanner, pressed && !loading && styles.pressed]}
        >
          <View style={styles.employeeIconWrap}>
            <Ionicons name="id-card-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.employeeCopy}>
            <AppText variant="caption" color={colors.textSecondary} style={styles.employeeHint}>
              Are you an employee? Login with your employee account.
            </AppText>
            <AppText variant="label" color={colors.primary}>
              Employee login ›
            </AppText>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  wave: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(99, 102, 241, 0.08)",
  },
  waveOne: {
    width: 280,
    height: 280,
    top: -80,
    right: -90,
  },
  waveTwo: {
    width: 200,
    height: 200,
    top: 120,
    left: -100,
    backgroundColor: "rgba(139, 92, 246, 0.06)",
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  brandCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  brandLogo: {
    borderRadius: 16,
  },
  tagline: {
    maxWidth: 200,
    lineHeight: 20,
  },
  heroArt: {
    width: 110,
    height: 96,
    position: "relative",
  },
  artBubble: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  artBubbleBack: {
    width: 54,
    height: 54,
    right: 8,
    top: 8,
    backgroundColor: "rgba(99, 102, 241, 0.12)",
  },
  artBubbleMid: {
    width: 48,
    height: 48,
    left: 0,
    bottom: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  artBubbleFront: {
    width: 56,
    height: 56,
    right: 0,
    bottom: 10,
    shadowColor: "#6366F1",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  artBadge: {
    position: "absolute",
    right: 40,
    top: 0,
    backgroundColor: colors.surface,
    borderRadius: 999,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
  },
  cardHeader: {
    gap: 4,
    marginBottom: spacing.xs,
  },
  welcomeTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  fieldLabel: {
    color: colors.text,
  },
  phoneField: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
  },
  codeBox: {
    minWidth: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  codeText: {
    fontSize: 15,
  },
  phoneDivider: {
    width: 1,
    alignSelf: "stretch",
    marginVertical: 12,
    backgroundColor: colors.border,
  },
  passwordField: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFC",
    paddingRight: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  eyeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  forgotRow: {
    alignSelf: "flex-end",
    marginTop: -4,
  },
  forgotText: {
    fontWeight: "600",
  },
  errorText: {
    marginTop: -4,
  },
  loginPressable: {
    marginTop: spacing.xs,
    borderRadius: 14,
    overflow: "hidden",
  },
  loginButton: {
    minHeight: 54,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  orText: {
    textTransform: "lowercase",
  },
  createButton: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  createDisabled: {
    borderColor: colors.disabled,
  },
  employeeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.12)",
  },
  employeeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  employeeCopy: {
    flex: 1,
    gap: 4,
  },
  employeeHint: {
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.9,
  },
});

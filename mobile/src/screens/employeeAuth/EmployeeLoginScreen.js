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
import AppText from "../../components/AppText";
import BrandLogo from "../../components/BrandLogo";
import { useAuth } from "../../context/AuthContext";
import { loginEmployee } from "../../services/employeeAuthService";
import { colors, spacing } from "../../theme";
import { validateMobile, validatePasswordRequired } from "../../utils/authValidation";
import { getDeviceInfo } from "../../utils/deviceInfo";

function HeroIllustration() {
  return (
    <View style={styles.heroArt} pointerEvents="none">
      <View style={[styles.artBubble, styles.artBubbleBack]} />
      <View style={[styles.artBubble, styles.artBubbleMid]}>
        <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
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
        <Ionicons name="shield-checkmark" size={18} color={colors.success} />
      </View>
    </View>
  );
}

export default function EmployeeLoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { completeEmployeeLogin } = useAuth();
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChangeMobileNumber = (value) => {
    setMobileNumber(value.replace(/\D/g, "").slice(0, 10));
  };

  const onLogin = async () => {
    const validationMessage =
      validateMobile(mobileNumber) || validatePasswordRequired(password);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const device = await getDeviceInfo();
      const result = await loginEmployee({
        phoneNumber: mobileNumber,
        countryCode: "+91",
        password,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        platform: device.platform,
      });
      await completeEmployeeLogin(result);
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
        <Pressable
          onPress={() => navigation.navigate("Login")}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Back to owner login"
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={18} color={colors.primary} />
          <AppText variant="caption" color={colors.primary} style={styles.backLabel}>
            Owner login
          </AppText>
        </Pressable>

        <View style={styles.brandRow}>
          <View style={styles.brandCopy}>
            <BrandLogo size={72} style={styles.brandLogo} />
            <AppText variant="caption" color={colors.textSecondary} style={styles.tagline}>
              Sign in with the mobile number and password shared by your shop.
            </AppText>
          </View>
          <HeroIllustration />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AppText variant="heading" style={styles.welcomeTitle}>
              Employee login
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Access your attendance, leave & salary
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
            onPress={() => navigation.navigate("EmployeeForgotPassword")}
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

          <View style={styles.noteBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <AppText variant="caption" color={colors.textSecondary} style={styles.noteText}>
              On first login you will be asked to change the temporary password. Accounts are created only by the shop owner.
            </AppText>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Owner login"
          disabled={loading}
          onPress={() => navigation.navigate("Login")}
          style={({ pressed }) => [styles.ownerBanner, pressed && !loading && styles.pressed]}
        >
          <View style={styles.ownerIconWrap}>
            <Ionicons name="storefront-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.ownerCopy}>
            <AppText variant="caption" color={colors.textSecondary} style={styles.ownerHint}>
              Managing a shop? Sign in with your owner account.
            </AppText>
            <AppText variant="label" color={colors.primary}>
              Owner login ›
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
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  backLabel: {
    fontWeight: "600",
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
    maxWidth: 220,
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
  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  noteText: {
    flex: 1,
    lineHeight: 18,
  },
  ownerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.12)",
  },
  ownerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  ownerCopy: {
    flex: 1,
    gap: 4,
  },
  ownerHint: {
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.9,
  },
});

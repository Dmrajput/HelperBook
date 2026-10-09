import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ScreenContainer from "../../components/ScreenContainer";
import { useAuth } from "../../context/AuthContext";
import { loginEmployee } from "../../services/employeeAuthService";
import theme, { colors, spacing } from "../../theme";
import { getDeviceInfo } from "../../utils/deviceInfo";

function validateMobile(value) {
  if (!/^[6-9]\d{9}$/.test(value)) return "Enter a valid 10-digit mobile number.";
  return "";
}

export default function EmployeeLoginScreen({ navigation }) {
  const { completeEmployeeLogin } = useAuth();
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    const validationMessage = validateMobile(mobileNumber) || (!password ? "Enter your password." : "");
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
    <ScreenContainer>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <AppText variant="title">HelperBook</AppText>
        <AppText variant="subtitle">Employee Login</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Sign in with the mobile number your shop enabled.
        </AppText>
        <View style={styles.phoneRow}>
          <View style={styles.codeBox}>
            <AppText variant="button">+91</AppText>
          </View>
          <TextInput
            value={mobileNumber}
            onChangeText={(value) => setMobileNumber(value.replace(/\D/g, "").slice(0, 10))}
            placeholder="Mobile Number"
            placeholderTextColor={colors.placeholder}
            keyboardType="phone-pad"
            maxLength={10}
            editable={!loading}
            style={styles.phoneInput}
            accessibilityLabel="Mobile number"
          />
        </View>
        <AppText variant="label">Password</AppText>
        <View style={styles.phoneRow}>
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
            style={styles.phoneInput}
            accessibilityLabel="Password"
          />
          <Pressable
            onPress={() => setShowPassword((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            style={styles.showButton}
          >
            <AppText variant="caption" color={colors.primary}>
              {showPassword ? "Hide" : "Show"}
            </AppText>
          </Pressable>
        </View>
        <Pressable
          onPress={() => navigation.navigate("EmployeeForgotPassword")}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Forgot password"
        >
          <AppText variant="body" color={colors.primary}>
            Forgot password?
          </AppText>
        </Pressable>
        {error ? <AppText variant="body" color={colors.error}>{error}</AppText> : null}
        <AppButton label={loading ? "Signing in..." : "Log in"} onPress={onLogin} loading={loading} />
        <AppText variant="caption" color={colors.textSecondary}>
          The first time, use Forgot password to choose a password. Only employees with login access can sign in.
        </AppText>
        <AppButton label="Owner Login" variant="secondary" onPress={() => navigation.navigate("Login")} disabled={loading} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingVertical: spacing.xxxl, gap: spacing.md },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  codeBox: {
    minHeight: theme.controlHeight,
    minWidth: 72,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  phoneInput: {
    flex: 1,
    minHeight: theme.controlHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontSize: 17,
  },
  showButton: {
    minHeight: theme.controlHeight,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
});

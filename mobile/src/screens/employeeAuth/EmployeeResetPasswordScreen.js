import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ScreenContainer from "../../components/ScreenContainer";
import { useAuth } from "../../context/AuthContext";
import { requestEmployeePasswordReset, resetEmployeePassword } from "../../services/employeeAuthService";
import theme, { colors, spacing } from "../../theme";
import { getDeviceInfo } from "../../utils/deviceInfo";

function masked(phone) {
  const digits = String(phone || "");
  return `+91 ******${digits.slice(-4)}`;
}

function validatePassword(value) {
  if (!value || value.length < 8 || value.length > 64 || !/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return "Use 8 to 64 characters with a letter and a number.";
  }
  return "";
}

export default function EmployeeResetPasswordScreen({ route }) {
  const { completeEmployeeLogin } = useAuth();
  const phoneNumber = route?.params?.phoneNumber || "";
  const savingRef = useRef(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(route?.params?.resendAfter || 30);

  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft((current) => (current > 0 ? current - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const onSave = async () => {
    const validationMessage =
      (code.length !== 6 ? "Enter the 6-digit code." : "")
      || validatePassword(password)
      || (password !== confirmPassword ? "Passwords do not match." : "");
    if (validationMessage || savingRef.current) {
      setError(validationMessage);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError("");
    try {
      const device = await getDeviceInfo();
      const result = await resetEmployeePassword({
        phoneNumber,
        countryCode: "+91",
        otp: code,
        password,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        platform: device.platform,
      });
      await completeEmployeeLogin(result);
    } catch (saveError) {
      setError(saveError?.message || "Unable to update the password. Please try again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const onResend = async () => {
    if (secondsLeft > 0 || resending || saving) return;
    setResending(true);
    setError("");
    try {
      const result = await requestEmployeePasswordReset(phoneNumber);
      setCode("");
      setSecondsLeft(result?.resendAfter || 30);
    } catch (resendError) {
      setError(resendError?.message || "Unable to send the code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <AppText variant="heading" accessibilityRole="header">
          Set a new password
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Enter the code sent to {masked(phoneNumber)}
        </AppText>
        <TextInput
          value={code}
          onChangeText={(value) => {
            setCode(value.replace(/\D/g, "").slice(0, 6));
            setError("");
          }}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          editable={!saving}
          style={styles.codeInput}
          accessibilityLabel="6 digit code"
        />
        <AppText variant="label">New password</AppText>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Letter and number, 8 or more"
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!saving}
          style={styles.input}
          accessibilityLabel="New password"
        />
        <AppText variant="label">Confirm password</AppText>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Enter password again"
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!saving}
          onSubmitEditing={onSave}
          style={styles.input}
          accessibilityLabel="Confirm password"
        />
        {error ? <AppText variant="body" color={colors.error}>{error}</AppText> : null}
        <AppButton label={saving ? "Saving..." : "Save password"} onPress={onSave} loading={saving} />
        <AppButton
          label={secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : resending ? "Sending code..." : "Resend code"}
          variant="secondary"
          onPress={onResend}
          disabled={secondsLeft > 0 || saving}
          loading={resending}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: spacing.md, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
  codeInput: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius,
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 8,
    color: colors.text,
  },
  input: {
    minHeight: theme.controlHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontSize: 17,
  },
});

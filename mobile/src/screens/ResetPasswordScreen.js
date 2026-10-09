import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import AppButton from "../components/AppButton";
import AppText from "../components/AppText";
import ScreenContainer from "../components/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import theme, { colors, spacing } from "../theme";

function formatPhone(phoneNumber) {
  const digits = String(phoneNumber || "");
  if (digits.length !== 10) {
    return `+91 ${digits}`;
  }
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

function validatePassword(value) {
  if (!value || value.length < 8 || value.length > 64 || !/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return "Use 8 to 64 characters with a letter and a number.";
  }
  return "";
}

export default function ResetPasswordScreen({ route }) {
  const { requestPasswordReset, resetPassword } = useAuth();
  const phoneNumber = route?.params?.phoneNumber || "";
  const verifyingRef = useRef(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(route?.params?.resendAfter || 30);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const onSave = async () => {
    const validationMessage =
      (code.length !== 6 ? "Enter the 6-digit code." : "")
      || validatePassword(password)
      || (password !== confirmPassword ? "Passwords do not match." : "");

    if (validationMessage || verifyingRef.current) {
      setError(validationMessage);
      return;
    }

    verifyingRef.current = true;
    setSaving(true);
    setError("");
    try {
      await resetPassword({ phoneNumber, otp: code, password });
    } catch (saveError) {
      setError(saveError?.message || "Unable to update the password. Please try again.");
    } finally {
      verifyingRef.current = false;
      setSaving(false);
    }
  };

  const onResend = async () => {
    if (secondsLeft > 0 || resending || saving) {
      return;
    }

    setResending(true);
    setError("");
    try {
      const result = await requestPasswordReset(phoneNumber);
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
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="heading" accessibilityRole="header">
          Set a new password
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Enter the code sent to{"\n"}
          {formatPhone(phoneNumber)}
        </AppText>

        <View style={styles.otpWrap}>
          <View style={styles.boxes} pointerEvents="none">
            {Array.from({ length: 6 }, (_, index) => (
              <View key={index} style={[styles.box, code[index] ? styles.boxFilled : null]}>
                <AppText variant="heading" align="center">
                  {code[index] || ""}
                </AppText>
              </View>
            ))}
          </View>
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
            style={styles.overlayInput}
            accessibilityLabel="6 digit code"
          />
        </View>

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

        {error ? (
          <AppText variant="body" color={colors.error}>
            {error}
          </AppText>
        ) : null}

        <AppButton
          label={saving ? "Saving..." : "Save password"}
          onPress={onSave}
          loading={saving}
        />

        <View style={styles.resendBlock}>
          <AppText variant="body" color={colors.textSecondary}>
            Didn't receive the code?
          </AppText>
          {secondsLeft > 0 ? (
            <AppText variant="body">Resend code in {secondsLeft} seconds</AppText>
          ) : (
            <AppButton
              label={resending ? "Sending code..." : "Resend code"}
              variant="secondary"
              onPress={onResend}
              loading={resending}
            />
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  otpWrap: {
    minHeight: theme.controlHeight + 8,
    justifyContent: "center",
  },
  boxes: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  box: {
    flex: 1,
    minHeight: theme.controlHeight + 8,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  boxFilled: {
    borderColor: colors.primary,
  },
  overlayInput: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    color: "transparent",
    fontSize: 20,
  },
  input: {
    minHeight: theme.controlHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 17,
  },
  resendBlock: {
    gap: spacing.sm,
  },
});

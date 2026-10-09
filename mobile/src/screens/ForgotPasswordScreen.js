import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import AppButton from "../components/AppButton";
import AppText from "../components/AppText";
import ScreenContainer from "../components/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import theme, { colors, spacing } from "../theme";

export default function ForgotPasswordScreen({ navigation }) {
  const { requestPasswordReset } = useAuth();
  const [mobileNumber, setMobileNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSend = async () => {
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await requestPasswordReset(mobileNumber);
      navigation.navigate("ResetPassword", {
        phoneNumber: mobileNumber,
        resendAfter: result?.resendAfter || 30,
      });
    } catch (requestError) {
      setError(requestError?.message || "Unable to send the code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <AppText variant="heading" accessibilityRole="header">
          Forgot password
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Enter the mobile number on your account. If it is registered, we will send a 6-digit code.
        </AppText>
        <AppText variant="label">Mobile Number</AppText>
        <View style={styles.phoneRow}>
          <View style={styles.codeBox}>
            <AppText variant="button">+91</AppText>
          </View>
          <TextInput
            value={mobileNumber}
            onChangeText={(value) => setMobileNumber(value.replace(/\D/g, "").slice(0, 10))}
            placeholder="Enter mobile number"
            placeholderTextColor={colors.placeholder}
            keyboardType="phone-pad"
            maxLength={10}
            editable={!loading}
            onSubmitEditing={onSend}
            style={styles.input}
            accessibilityLabel="Mobile number"
          />
        </View>
        {error ? (
          <AppText variant="body" color={colors.error}>
            {error}
          </AppText>
        ) : null}
        <AppButton
          label={loading ? "Sending code..." : "Send code"}
          onPress={onSend}
          loading={loading}
        />
        <Pressable
          onPress={() => navigation.goBack()}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Back to login"
        >
          <AppText variant="body" color={colors.primary} align="center">
            Back to login
          </AppText>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.lg,
    paddingTop: spacing.xxl,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  codeBox: {
    minHeight: theme.controlHeight,
    minWidth: 72,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    minHeight: theme.controlHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 17,
  },
});

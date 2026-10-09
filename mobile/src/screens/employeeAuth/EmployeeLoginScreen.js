import { useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ScreenContainer from "../../components/ScreenContainer";
import { requestEmployeeOtp } from "../../services/employeeAuthService";
import theme, { colors, spacing } from "../../theme";

function validateMobile(value) {
  if (!/^[6-9]\d{9}$/.test(value)) return "Enter a valid 10-digit mobile number.";
  return "";
}

export default function EmployeeLoginScreen({ navigation }) {
  const [mobileNumber, setMobileNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSendOtp = async () => {
    const validationMessage = validateMobile(mobileNumber);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await requestEmployeeOtp(mobileNumber);
      navigation.navigate("EmployeeOtp", { phoneNumber: mobileNumber, resendAfter: result?.resendAfter || 30 });
    } catch (requestError) {
      setError(requestError?.isNetworkError ? requestError.message : requestError?.message || "Unable to send OTP. Please try again.");
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
          Enter your mobile number
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
            style={styles.phoneInput}
            accessibilityLabel="Mobile number"
          />
        </View>
        {error ? <AppText variant="body" color={colors.error}>{error}</AppText> : null}
        <AppButton label={loading ? "Sending OTP..." : "Send OTP"} onPress={onSendOtp} loading={loading} />
        <AppText variant="caption" color={colors.textSecondary}>
          Only employees with login access enabled can sign in.
        </AppText>
        <AppButton label="Owner Login" variant="secondary" onPress={() => navigation.navigate("Login")} />
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
});

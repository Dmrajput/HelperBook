import { useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ScreenContainer from "../../components/ScreenContainer";
import { useAuth } from "../../context/AuthContext";
import { requestEmployeeOtp, verifyEmployeeOtp } from "../../services/employeeAuthService";
import { colors, spacing } from "../../theme";
import { getDeviceInfo } from "../../utils/deviceInfo";

function masked(phone) {
  const digits = String(phone || "");
  return `+91 ******${digits.slice(-4)}`;
}

function friendly(error) {
  if (error?.isNetworkError) return "Unable to connect.\nPlease check your internet connection and try again.";
  if (error?.code === "EMPLOYEE_LOGIN_DISABLED") return "Your employee login is currently disabled.\nPlease contact your shop owner.";
  if (error?.code === "EMPLOYEE_INACTIVE") return "This employee account is inactive.\nPlease contact your shop owner.";
  return error?.message || "The OTP is incorrect or has expired.";
}

export default function EmployeeOtpScreen({ route }) {
  const { completeEmployeeLogin } = useAuth();
  const phoneNumber = route?.params?.phoneNumber || "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(route?.params?.resendAfter || 30);

  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft((current) => (current > 0 ? current - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const submitCode = async (nextCode) => {
    if (verifying || nextCode.length !== 6) return;
    setVerifying(true);
    setError("");
    try {
      const device = await getDeviceInfo();
      const result = await verifyEmployeeOtp({
        phoneNumber,
        countryCode: "+91",
        otp: nextCode,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        platform: device.platform,
      });
      await completeEmployeeLogin(result);
    } catch (verifyError) {
      setError(friendly(verifyError));
      setVerifying(false);
    }
  };

  const resend = async () => {
    if (secondsLeft > 0) return;
    setError("");
    try {
      const result = await requestEmployeeOtp(phoneNumber);
      setSecondsLeft(result?.resendAfter || 30);
    } catch (resendError) {
      setError(friendly(resendError));
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.wrap}>
        <AppText variant="title">Enter OTP</AppText>
        <AppText variant="body" color={colors.textSecondary}>OTP sent to {masked(phoneNumber)}</AppText>
        <TextInput
          value={code}
          onChangeText={(value) => {
            const next = value.replace(/\D/g, "").slice(0, 6);
            setCode(next);
            if (next.length === 6) submitCode(next);
          }}
          keyboardType="number-pad"
          maxLength={6}
          style={styles.input}
          accessibilityLabel="One time password"
        />
        {error ? <AppText variant="body" color={colors.error}>{error}</AppText> : null}
        <AppButton
          label={secondsLeft > 0 ? `Resend OTP in ${secondsLeft}s` : "Resend OTP"}
          variant="secondary"
          onPress={resend}
          disabled={secondsLeft > 0 || verifying}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", gap: spacing.md },
  input: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 8,
    color: colors.text,
  },
});

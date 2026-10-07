import { useEffect, useRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
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

export default function OtpVerificationScreen({ route }) {
  const { requestOtp, verifyOtp } = useAuth();
  const phoneNumber = route?.params?.phoneNumber || "";
  const inputRef = useRef(null);
  const verifyingRef = useRef(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(route?.params?.resendAfter || 30);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const submitCode = async (nextCode) => {
    if (verifyingRef.current || nextCode.length !== 6) {
      return;
    }

    verifyingRef.current = true;
    setVerifying(true);
    setError("");

    try {
      await verifyOtp({ phoneNumber, otp: nextCode });
    } catch (verifyError) {
      setCode("");
      setError(verifyError?.message || "Incorrect OTP. Please try again.");
    } finally {
      verifyingRef.current = false;
      setVerifying(false);
    }
  };

  const onChangeCode = (value) => {
    const nextCode = value.replace(/\D/g, "").slice(0, 6);
    setCode(nextCode);
    setError("");
    if (nextCode.length === 6) {
      submitCode(nextCode);
    }
  };

  const onResend = async () => {
    if (secondsLeft > 0 || resending || verifying) {
      return;
    }

    setResending(true);
    setError("");

    try {
      const result = await requestOtp(phoneNumber);
      setCode("");
      setSecondsLeft(result?.resendAfter || 30);
    } catch (resendError) {
      setError(resendError?.message || "Unable to send OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <AppText variant="heading" accessibilityRole="header">
          Verify your number
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          OTP sent to{"\n"}
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
            ref={inputRef}
            value={code}
            onChangeText={onChangeCode}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            editable={!verifying}
            style={styles.overlayInput}
            accessibilityLabel="6 digit OTP"
          />
        </View>

        {error ? (
          <AppText variant="body" color={colors.error}>
            {error}
          </AppText>
        ) : null}

        <AppButton
          label={verifying ? "Verifying..." : "Verify OTP"}
          onPress={() => submitCode(code)}
          loading={verifying}
          disabled={code.length !== 6}
        />

        <View style={styles.resendBlock}>
          <AppText variant="body" color={colors.textSecondary}>
            Didn't receive OTP?
          </AppText>
          {secondsLeft > 0 ? (
            <AppText variant="body">Resend OTP in {secondsLeft} seconds</AppText>
          ) : (
            <AppButton
              label={resending ? "Sending OTP..." : "Resend OTP"}
              variant="secondary"
              onPress={onResend}
              loading={resending}
            />
          )}
        </View>
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
  resendBlock: {
    gap: spacing.sm,
  },
});

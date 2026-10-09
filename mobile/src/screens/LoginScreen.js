import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import AppButton from "../components/AppButton";
import AppText from "../components/AppText";
import ErrorView from "../components/ErrorView";
import ScreenContainer from "../components/ScreenContainer";
import {
  APP_NAME,
  LOGIN_HEADLINE,
  SERVER_CONNECTED_MESSAGE,
  SERVER_UNREACHABLE_BODY,
  SERVER_UNREACHABLE_TITLE,
} from "../constants/app";
import { useAuth } from "../context/AuthContext";
import { useServerConnection } from "../hooks/useServerConnection";
import theme, { colors, spacing } from "../theme";

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

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { status, checkConnection } = useServerConnection();
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
    <ScreenContainer style={styles.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppText variant="title" accessibilityRole="header">
            {APP_NAME}
          </AppText>
          <AppText variant="subtitle" color={colors.textSecondary}>
            {LOGIN_HEADLINE}
          </AppText>
        </View>

        <View style={styles.form}>
          <AppText variant="label">Mobile Number</AppText>
          <View style={styles.phoneRow}>
            <View style={styles.codeBox}>
              <AppText variant="button">+91</AppText>
            </View>
            <TextInput
              value={mobileNumber}
              onChangeText={onChangeMobileNumber}
              placeholder="Enter mobile number"
              placeholderTextColor={colors.placeholder}
              keyboardType="phone-pad"
              maxLength={10}
              editable={!loading}
              onSubmitEditing={onLogin}
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
            onPress={() => navigation.navigate("ForgotPassword")}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Forgot password"
          >
            <AppText variant="body" color={colors.primary}>
              Forgot password?
            </AppText>
          </Pressable>
          {error ? (
            <AppText variant="body" color={colors.error}>
              {error}
            </AppText>
          ) : null}
          <AppButton
            label={loading ? "Signing in..." : "Log in"}
            onPress={onLogin}
            loading={loading}
          />
          <AppButton
            label="Create account"
            variant="secondary"
            onPress={() => navigation.navigate("Register")}
            disabled={loading}
          />
          <AppButton
            label="Employee Login"
            variant="secondary"
            onPress={() => navigation.navigate("EmployeeLogin")}
            disabled={loading}
          />
        </View>

        {__DEV__ ? (
          <View style={styles.devSection}>
            <AppText variant="caption" color={colors.textSecondary}>
              Development only
            </AppText>
            <AppButton
              label="Check Server Connection"
              variant="secondary"
              onPress={checkConnection}
              loading={status === "loading"}
            />
            {status === "success" ? (
              <View style={styles.successBox}>
                <AppText variant="body" color={colors.success}>
                  {SERVER_CONNECTED_MESSAGE}
                </AppText>
              </View>
            ) : null}
            {status === "error" ? (
              <ErrorView
                title={SERVER_UNREACHABLE_TITLE}
                message={SERVER_UNREACHABLE_BODY}
                onRetry={checkConnection}
              />
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingVertical: 0,
  },
  scroll: {
    flexGrow: 1,
    paddingVertical: spacing.xxxl,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.md,
  },
  form: {
    gap: spacing.md,
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
  phoneInput: {
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
  showButton: {
    minHeight: theme.controlHeight,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  devSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  successBox: {
    backgroundColor: colors.successBackground,
    borderRadius: 12,
    padding: spacing.lg,
  },
});

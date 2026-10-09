import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import AppButton from "../components/AppButton";
import AppText from "../components/AppText";
import ScreenContainer from "../components/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import theme, { colors, spacing } from "../theme";

function validateMobile(value) {
  if (!/^[6-9]\d{9}$/.test(value || "")) {
    return "Enter a valid 10-digit mobile number.";
  }
  return "";
}

function validatePassword(value) {
  if (!value || value.length < 8 || value.length > 64 || !/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return "Use 8 to 64 characters with a letter and a number.";
  }
  return "";
}

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onCreate = async () => {
    const name = fullName.trim();
    const validationMessage =
      (name.length < 2 ? "Enter your name." : "")
      || validateMobile(mobileNumber)
      || validatePassword(password)
      || (password !== confirmPassword ? "Passwords do not match." : "");

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setLoading(true);
    setError("");
    try {
      await register({ fullName: name, phoneNumber: mobileNumber, password });
    } catch (requestError) {
      setError(requestError?.message || "Unable to create the account. Please try again.");
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
          <AppText variant="heading" accessibilityRole="header">
            Create account
          </AppText>
          <AppText variant="body" color={colors.textSecondary}>
            Use your mobile number and a password to open your shop.
          </AppText>
        </View>

        <View style={styles.form}>
          <AppText variant="label">Your name</AppText>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your name"
            placeholderTextColor={colors.placeholder}
            editable={!loading}
            maxLength={100}
            style={styles.input}
            accessibilityLabel="Your name"
          />
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
            style={styles.phoneInput}
            accessibilityLabel="Mobile number"
            />
          </View>
          <AppText variant="label">Password</AppText>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Letter and number, 8 or more"
            placeholderTextColor={colors.placeholder}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            style={styles.input}
            accessibilityLabel="Password"
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
            editable={!loading}
            onSubmitEditing={onCreate}
            style={styles.input}
            accessibilityLabel="Confirm password"
          />
          {error ? (
            <AppText variant="body" color={colors.error}>
              {error}
            </AppText>
          ) : null}
          <AppButton
            label={loading ? "Creating account..." : "Create account"}
            onPress={onCreate}
            loading={loading}
          />
          <Pressable
            onPress={() => navigation.goBack()}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Back to login"
          >
            <AppText variant="body" color={colors.primary} align="center">
              Already have an account? Log in
            </AppText>
          </Pressable>
        </View>
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
});

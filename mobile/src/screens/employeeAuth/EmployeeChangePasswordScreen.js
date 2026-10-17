import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import AppScreen from "../../components/AppScreen";
import ScreenContainer from "../../components/ScreenContainer";
import { useAuth } from "../../context/AuthContext";
import { changeEmployeePassword } from "../../services/employeeAuthService";
import theme, { colors, spacing } from "../../theme";

function validateNewPassword(value) {
  if (!value || value.length < 8 || value.length > 64 || !/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return "Use 8 to 64 characters with at least one letter and one number.";
  }
  return "";
}

function PasswordField({ label, value, onChangeText, show, onToggle, editable }) {
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="••••••••"
          placeholderTextColor={colors.placeholder}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
          style={styles.input}
          accessibilityLabel={label}
        />
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={show ? "Hide password" : "Show password"}
          style={styles.showButton}
        >
          <AppText variant="caption" color={colors.primary}>
            {show ? "Hide" : "Show"}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

export default function EmployeeChangePasswordScreen({ navigation, route }) {
  const forced = Boolean(route?.params?.forced);
  const { logout, patchUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (loading) return;
    if (!currentPassword) {
      setError("Enter your current password.");
      return;
    }
    const policyError = validateNewPassword(newPassword);
    if (policyError) {
      setError(policyError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("Choose a new password that is different from your current password.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await changeEmployeePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      patchUser?.({ mustChangePassword: false });
      Alert.alert("Password updated", "Sign in again with your new password.", [
        {
          text: "OK",
          onPress: async () => {
            await logout();
          },
        },
      ]);
    } catch (requestError) {
      setError(requestError?.message || "Unable to change password.");
    } finally {
      setLoading(false);
    }
  }

  const body = (
    <>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {forced ? (
          <AppText variant="body" color={colors.textSecondary}>
            For security, change the temporary password before using HelperBook.
          </AppText>
        ) : null}
        <PasswordField
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          show={showCurrent}
          onToggle={() => setShowCurrent((value) => !value)}
          editable={!loading}
        />
        <PasswordField
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          show={showNew}
          onToggle={() => setShowNew((value) => !value)}
          editable={!loading}
        />
        <PasswordField
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          show={showConfirm}
          onToggle={() => setShowConfirm((value) => !value)}
          editable={!loading}
        />
        {error ? (
          <AppText variant="body" color={colors.error}>
            {error}
          </AppText>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <AppButton label={loading ? "Saving..." : "Change Password"} onPress={submit} disabled={loading} loading={loading} />
        {forced ? (
          <AppButton label="Logout" variant="secondary" onPress={logout} disabled={loading} />
        ) : (
          <AppButton label="Cancel" variant="secondary" onPress={() => navigation.goBack()} disabled={loading} />
        )}
      </View>
    </>
  );

  if (forced) {
    return (
      <ScreenContainer>
        <View style={styles.forcedHeader}>
          <AppText variant="title">Change Password</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Required before continuing
          </AppText>
        </View>
        {body}
      </ScreenContainer>
    );
  }

  return (
    <AppScreen title="Change Password" subtitle="Update your login" icon="lock-closed-outline">
      {body}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  forcedHeader: {
    gap: 4,
    marginBottom: spacing.md,
  },
  field: {
    gap: spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: theme.controlHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontSize: 17,
    backgroundColor: colors.surface,
  },
  showButton: {
    minHeight: theme.controlHeight,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
});

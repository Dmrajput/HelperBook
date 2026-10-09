import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AppText from "../../components/AppText";
import FieldError from "../../components/FieldError";
import NotificationPreferences from "../../components/notifications/NotificationPreferences";
import ScreenContainer from "../../components/ScreenContainer";
import { getNotificationPreferences, updateNotificationPreferences } from "../../services/notificationService";
import { devicePushPermission } from "../../services/pushNotificationService";
import { colors, spacing } from "../../theme";

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const [values, setValues] = useState(null);
  const [permission, setPermission] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getNotificationPreferences()
        .then((next) => {
          if (active) setValues(next);
        })
        .catch((loadError) => {
          if (active) setError(loadError.message || "Unable to update notification settings.");
        });
      devicePushPermission().then((status) => {
        if (active) setPermission(status);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  async function change(key, nextValue) {
    if (!values || saving) return;
    const previous = values;
    const next = { ...values, [key]: nextValue };
    setValues(next);
    setSaving(true);
    setError("");
    try {
      setValues(await updateNotificationPreferences(next));
    } catch (saveError) {
      setValues(previous);
      setError(saveError.message || "Unable to update notification settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <AppText variant="label" color={colors.primary} onPress={() => navigation.goBack()}>
          Back
        </AppText>
        <AppText variant="heading" accessibilityRole="header">
          Notifications
        </AppText>
        {permission === "denied" ? (
          <AppText variant="body" color={colors.textSecondary}>
            Push notifications are disabled in your device settings. You can still view notifications in HelperBook.
          </AppText>
        ) : null}
        {permission === "unavailable" || permission === "expo-go" ? (
          <AppText variant="body" color={colors.textSecondary}>
            {permission === "expo-go"
              ? "Push notifications are not available in Expo Go on Android. You can still view notifications in HelperBook."
              : "Push notifications are unavailable on this device. You can still view notifications in HelperBook."}
          </AppText>
        ) : null}
        {!values ? <ActivityIndicator color={colors.primary} /> : null}
        {values ? <NotificationPreferences values={values} onChange={change} disabled={saving} /> : null}
        <FieldError message={error} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingTop: spacing.lg },
});

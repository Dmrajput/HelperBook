import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import ScreenContainer from "../../components/ScreenContainer";
import { getEmployeeNotifications } from "../../services/employeePortalService";
import { colors, spacing } from "../../theme";
import { navigateFromNotification } from "../../utils/notificationNavigation";

export default function EmployeeNotificationsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getEmployeeNotifications();
      setItems(data.notifications || []);
      setError("");
    } catch (loadError) {
      setError(loadError?.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <ScreenContainer>
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />} contentContainerStyle={styles.content}>
        <AppText variant="title">Notifications</AppText>
        {error ? <ErrorView message={error} onRetry={load} /> : null}
        {!loading && !items.length ? <AppText variant="body">No notifications yet.</AppText> : null}
        {items.map((item) => (
          <Pressable key={item.id} onPress={() => navigateFromNotification(navigation, item, "employee")} style={styles.card}>
            <AppText variant="label">{item.title}</AppText>
            <AppText variant="body">{item.message}</AppText>
          </Pressable>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xxl },
  card: { gap: spacing.xs, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
});

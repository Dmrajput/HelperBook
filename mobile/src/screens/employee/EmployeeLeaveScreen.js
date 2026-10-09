import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import AppScreen from "../../components/AppScreen";
import { getEmployeeLeaves } from "../../services/employeePortalService";
import { colors, spacing } from "../../theme";

const FILTERS = ["", "pending", "approved", "rejected", "cancelled"];

export default function EmployeeLeaveScreen({ navigation }) {
  const [filter, setFilter] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getEmployeeLeaves(filter || undefined));
      setError("");
    } catch (loadError) {
      setError(loadError?.message || "Unable to load leave.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <AppScreen title="Leave" subtitle="Your requests" icon="calendar" showBack={false}>
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />} contentContainerStyle={styles.content}>
        <AppButton label="Request Leave" onPress={() => navigation.navigate("EmployeeCreateLeave")} />
        <AppText variant="body">Pending {data?.summary?.pending || 0}  Approved {data?.summary?.approved || 0}  Upcoming {data?.summary?.upcoming || 0}</AppText>
        <View style={styles.filters}>
          {FILTERS.map((item) => (
            <AppButton key={item || "all"} label={item || "All"} variant={filter === item ? "primary" : "secondary"} onPress={() => setFilter(item)} />
          ))}
        </View>
        {error ? <ErrorView message={error} onRetry={load} /> : null}
        {!loading && !(data?.leaves || []).length ? <AppText variant="body">No leave requests yet.</AppText> : null}
        {(data?.leaves || []).map((leave) => (
          <AppButton
            key={leave.id}
            label={`${leave.startDate} - ${leave.endDate} ${leave.leaveType} ${leave.status}`}
            variant="secondary"
            onPress={() => navigation.navigate("EmployeeLeaveDetail", { leaveId: leave.id })}
          />
        ))}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xxl },
  filters: { gap: spacing.sm },
});

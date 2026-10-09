import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import AppTextInput from "../../components/AppTextInput";
import ErrorView from "../../components/ErrorView";
import OutstandingBalanceCard from "../../components/advance/OutstandingBalanceCard";
import AdvanceSummaryCard from "../../components/advance/AdvanceSummaryCard";
import ScreenContainer from "../../components/ScreenContainer";
import { getAdvances } from "../../services/advanceService";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";

const FILTERS = [
  { id: "active", label: "Outstanding" },
  { id: "all", label: "All" },
  { id: "closed", label: "Closed" },
];

export default function AdvanceOverviewScreen({ navigation }) {
  const [status, setStatus] = useState("active");
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await getAdvances({ status, search: search.trim(), limit: 100 }));
    } catch (loadError) {
      setError(loadError.message || "Unable to load advance information. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppText variant="heading">Employee Advances</AppText>
        {loading && !data ? <View style={styles.block} accessibilityLabel="Loading advances" /> : null}
        {error && !data ? <ErrorView message={error} onRetry={load} /> : null}
        {data ? (
          <>
            <OutstandingBalanceCard amount={data.summary.outstanding} label="Total outstanding" />
            <AdvanceSummaryCard summary={data.summary} />
            <AppTextInput label="Search employee" value={search} onChangeText={setSearch} placeholder="Name" />
            <View style={styles.filters}>
              {FILTERS.map((filter) => (
                <Pressable
                  key={filter.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: status === filter.id }}
                  onPress={() => setStatus(filter.id)}
                  style={[styles.filter, status === filter.id && styles.selected]}
                >
                  <AppText variant="caption" color={status === filter.id ? colors.textInverse : colors.text}>
                    {filter.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
            {data.employees.length === 0 ? (
              <AppText variant="body" color={colors.textSecondary}>
                {status === "active" ? "No outstanding advance." : "No advance records yet."}
              </AppText>
            ) : null}
            {data.employees.map((item) => (
              <Pressable
                key={item.employee.id}
                accessibilityRole="button"
                accessibilityLabel={`View khata for ${item.employee.name}`}
                onPress={() => navigation.navigate("EmployeeAdvance", { employeeId: item.employee.id })}
                style={styles.card}
              >
                <AppText variant="subtitle">{item.employee.name}</AppText>
                <AppText variant="body">
                  {item.outstanding > 0 ? `Advance outstanding ${formatInr(item.outstanding)}` : "No outstanding"}
                </AppText>
                <AppText variant="caption" color={colors.primary}>
                  View
                </AppText>
              </Pressable>
            ))}
          </>
        ) : null}
        <AppButton label="Back" variant="secondary" onPress={() => navigation.goBack()} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.lg, paddingBottom: spacing.xxl },
  block: { height: 120, borderRadius: 12, backgroundColor: colors.disabled },
  filters: { flexDirection: "row", gap: spacing.sm },
  filter: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
});

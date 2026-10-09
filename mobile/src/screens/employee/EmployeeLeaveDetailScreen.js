import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import ScreenContainer from "../../components/ScreenContainer";
import { cancelEmployeeLeave, getEmployeeLeave } from "../../services/employeePortalService";
import { colors, spacing } from "../../theme";

export default function EmployeeLeaveDetailScreen({ route }) {
  const leaveId = route?.params?.leaveId;
  const [leave, setLeave] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getEmployeeLeave(leaveId);
      setLeave(data.leave);
      setError("");
    } catch (loadError) {
      setError(loadError?.message || "You don't have access to this information.");
    } finally {
      setLoading(false);
    }
  }, [leaveId]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const cancel = () => {
    Alert.alert("Cancel leave", "Cancel this leave request?", [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel leave",
        style: "destructive",
        onPress: async () => {
          try {
            const data = await cancelEmployeeLeave(leaveId);
            setLeave(data.leave);
          } catch (cancelError) {
            setError(cancelError?.message || "Unable to cancel this leave.");
          }
        },
      },
    ]);
  };

  if (error && !leave) return <ScreenContainer><ErrorView message={error} onRetry={load} /></ScreenContainer>;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="title">{leave?.status || "Leave"}</AppText>
        <AppText variant="body">{leave?.startDate} - {leave?.endDate}</AppText>
        <AppText variant="body">{leave?.leaveType} leave, {leave?.totalDays} days</AppText>
        {leave?.reason ? <AppText variant="body">{leave.reason}</AppText> : null}
        {leave?.rejectionReason ? <AppText variant="body" color={colors.error}>{leave.rejectionReason}</AppText> : null}
        {leave?.status === "pending" || leave?.status === "approved" ? (
          <AppButton label="Cancel Request" variant="secondary" onPress={cancel} disabled={loading} />
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xxl },
});

import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AppText from "../AppText";
import ErrorView from "../ErrorView";
import ScreenContainer from "../ScreenContainer";
import { getEmployees } from "../../services/employeeService";
import useReport from "../../hooks/useReport";
import { colors, spacing } from "../../theme";
import { currentMonthRange } from "../../utils/reportFormatters";
import { EXCEL_ERROR, PDF_ERROR, shareDownloadedReport } from "../../utils/reportExport";
import ReportEmptyState from "./ReportEmptyState";
import ReportExportActions from "./ReportExportActions";
import ReportFilterBar from "./ReportFilterBar";
import ReportSummaryCard from "./ReportSummaryCard";

export default function ReportBrowser({
  title,
  description,
  loader,
  exportPdf,
  exportExcel,
  groupsFor,
  summaryItems,
  renderRow,
  renderExtra,
  emptyTitle,
  emptyMessage,
  showSummaryWhenEmpty = false,
}) {
  const navigation = useNavigation();
  const initial = currentMonthRange();
  const [range, setRange] = useState(initial);
  const [employeeId, setEmployeeId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState("");

  const params = { from: range.from, to: range.to, page, limit: 20, ...(employeeId ? { employeeId } : {}), ...filters };
  const stableLoader = useCallback((next) => loader(next), [loader]);
  const report = useReport(stableLoader, params);

  const loadEmployees = useCallback(async () => {
    try {
      const active = await getEmployees({ status: "active", limit: 50 });
      const inactive = await getEmployees({ status: "inactive", limit: 50 });
      const merged = [...(active.employees || []), ...(inactive.employees || [])];
      const seen = new Set();
      setEmployees(merged.filter((employee) => (seen.has(employee.id) ? false : seen.add(employee.id))));
    } catch {
      setEmployees([]);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const groups = groupsFor(filters, (key, value) => {
    setPage(1);
    setFilters((current) => {
      const next = { ...current };
      if (value === undefined || value === null || value === "") {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  });
  const defaultRange = currentMonthRange();
  const filtersActive = Boolean(employeeId) || range.from !== defaultRange.from || Object.values(filters).some(Boolean);

  async function exportFile(kind) {
    if (exporting) return;
    setExporting(kind);
    try {
      const file = kind === "pdf" ? await exportPdf(params) : await exportExcel(params);
      await shareDownloadedReport(file, kind);
    } catch (error) {
      Alert.alert(kind === "pdf" ? "Export PDF" : "Export Excel", error.message || (kind === "pdf" ? PDF_ERROR : EXCEL_ERROR));
    } finally {
      setExporting("");
    }
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={report.refreshing} onRefresh={report.reload} />}
      >
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()} style={styles.back}>
          <AppText variant="label" color={colors.primary}>
            Back
          </AppText>
        </Pressable>
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {description}
        </AppText>
        <ReportFilterBar
          range={range}
          onRangeChange={(next) => {
            setPage(1);
            setRange(next);
          }}
          employees={employees}
          employeeId={employeeId}
          onEmployeeChange={(id) => {
            setPage(1);
            setEmployeeId(id);
          }}
          groups={groups}
          filtersActive={filtersActive}
          onReset={() => {
            setRange(currentMonthRange());
            setEmployeeId(null);
            setFilters({});
            setPage(1);
          }}
        />
        {report.loading ? <ActivityIndicator color={colors.primary} /> : null}
        {report.error ? (
          <ErrorView title="Unable to load report." message="Please try again." onRetry={report.reload} />
        ) : null}
        {!report.loading && !report.error && report.data?.summary?.hasRecords === false && !showSummaryWhenEmpty ? (
          <ReportEmptyState title={emptyTitle} message={emptyMessage} />
        ) : null}
        {!report.loading && !report.error && report.data && (report.data.summary?.hasRecords || showSummaryWhenEmpty) ? (
          <>
            {report.data.summary?.hasRecords === false ? <ReportEmptyState title={emptyTitle} message={emptyMessage} /> : null}
            <ReportSummaryCard items={summaryItems(report.data)} />
            <View style={styles.list}>
              {(report.data.rows || []).map((row, index) => (
                <View key={row.salaryId || row.paymentId || row.leaveId || row.transactionId || `${row.employeeId}-${index}`}>
                  {renderRow(row, navigation)}
                </View>
              ))}
              {renderExtra ? renderExtra(report.data, navigation) : null}
            </View>
            {report.data.pagination?.pages > 1 ? (
              <View style={styles.pager}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Previous page"
                  disabled={page <= 1}
                  onPress={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <AppText variant="label" color={page <= 1 ? colors.disabledText : colors.primary}>
                    Previous page
                  </AppText>
                </Pressable>
                <AppText variant="label">
                  {page} / {report.data.pagination.pages}
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Next page"
                  disabled={page >= report.data.pagination.pages}
                  onPress={() => setPage((current) => current + 1)}
                >
                  <AppText variant="label" color={page >= report.data.pagination.pages ? colors.disabledText : colors.primary}>
                    Next page
                  </AppText>
                </Pressable>
              </View>
            ) : null}
            <ReportExportActions exporting={exporting} onPdf={() => exportFile("pdf")} onExcel={() => exportFile("excel")} />
          </>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  back: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  list: { gap: spacing.sm },
  pager: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 44 },
});

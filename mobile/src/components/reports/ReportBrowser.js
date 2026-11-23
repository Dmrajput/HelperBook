import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../AppText";
import ErrorView from "../ErrorView";
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
  icon = "bar-chart-outline",
  iconColor = "#DB2777",
  iconBackground = "#FCE7F3",
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
  const insets = useSafeAreaInsets();
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
  const hasContent =
    !report.loading && !report.error && report.data && (report.data.summary?.hasRecords || showSummaryWhenEmpty);
  const rows = report.data?.rows || [];

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
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
            style={styles.back}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title} numberOfLines={1}>
              {title}
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={2}>
              {description}
            </AppText>
          </View>
          <View style={[styles.headerAction, { backgroundColor: iconBackground }]}>
            <Ionicons name={icon} size={20} color={iconColor} />
          </View>
        </View>
      </View>

      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={report.refreshing} onRefresh={report.reload} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        >
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

          {report.loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
          {report.error ? (
            <ErrorView title="Unable to load report." message="Please try again." onRetry={report.reload} />
          ) : null}

          {!report.loading && !report.error && report.data?.summary?.hasRecords === false && !showSummaryWhenEmpty ? (
            <ReportEmptyState title={emptyTitle} message={emptyMessage} />
          ) : null}

          {hasContent ? (
            <>
              {report.data.summary?.hasRecords === false ? (
                <ReportEmptyState title={emptyTitle} message={emptyMessage} />
              ) : null}
              <ReportSummaryCard items={summaryItems(report.data)} />

              {rows.length > 0 || renderExtra ? (
                <View style={styles.sectionHeader}>
                  <AppText variant="label" style={styles.sectionTitle}>
                    Results
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {`${rows.length} rows`}
                  </AppText>
                </View>
              ) : null}

              <View style={styles.list}>
                {rows.map((row, index) => (
                  <View
                    key={row.salaryId || row.paymentId || row.leaveId || row.transactionId || `${row.employeeId}-${index}`}
                  >
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
                    style={[styles.pageBtn, page <= 1 && styles.pageDisabled]}
                  >
                    <Ionicons name="chevron-back" size={16} color={page <= 1 ? colors.disabledText : colors.primary} />
                    <AppText variant="caption" color={page <= 1 ? colors.disabledText : colors.primary} style={styles.pageText}>
                      Previous
                    </AppText>
                  </Pressable>
                  <AppText variant="label" style={styles.pageCount}>
                    {`${page} / ${report.data.pagination.pages}`}
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Next page"
                    disabled={page >= report.data.pagination.pages}
                    onPress={() => setPage((current) => current + 1)}
                    style={[styles.pageBtn, page >= report.data.pagination.pages && styles.pageDisabled]}
                  >
                    <AppText
                      variant="caption"
                      color={page >= report.data.pagination.pages ? colors.disabledText : colors.primary}
                      style={styles.pageText}
                    >
                      Next
                    </AppText>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={page >= report.data.pagination.pages ? colors.disabledText : colors.primary}
                    />
                  </Pressable>
                </View>
              ) : null}
            </>
          ) : null}
        </ScrollView>

        {hasContent ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <ReportExportActions exporting={exporting} onPdf={() => exportFile("pdf")} onExcel={() => exportFile("excel")} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  back: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.text,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  loader: {
    marginVertical: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 16,
  },
  list: {
    gap: spacing.sm,
  },
  pager: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    minHeight: 48,
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  pageDisabled: {
    opacity: 0.5,
  },
  pageText: {
    fontWeight: "700",
  },
  pageCount: {
    fontWeight: "700",
  },
  footer: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});

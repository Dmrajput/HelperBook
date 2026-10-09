import ReportBrowser from "../../components/reports/ReportBrowser";
import ReportRow from "../../components/reports/ReportRow";
import { exportSalaryExcel, exportSalaryPdf, getSalaryReport } from "../../services/reportService";
import { formatInr } from "../../utils/dashboardFormat";

const SALARY_STATUS = [
  { value: "finalized", label: "Finalized" },
  { value: "draft", label: "Draft" },
  { value: "all", label: "All" },
];
const PAYMENT_STATUS = [
  { value: "all", label: "All payments" },
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "reversed", label: "Reversed" },
];

export default function SalaryReportScreen() {
  return (
    <ReportBrowser
      title="Salary Report"
      description="Salary calculated for this period. Payment date is not used here."
      loader={getSalaryReport}
      exportPdf={exportSalaryPdf}
      exportExcel={exportSalaryExcel}
      emptyTitle="No finalized salaries found for this period."
      emptyMessage="Try selecting another month or employee."
      groupsFor={(filters, onChange) => [
        {
          key: "salaryStatus",
          value: filters.salaryStatus || "finalized",
          defaultValue: "finalized",
          options: SALARY_STATUS,
          onChange: (value) => onChange("salaryStatus", value === "finalized" ? undefined : value),
        },
        {
          key: "paymentStatus",
          value: filters.paymentStatus || "all",
          options: PAYMENT_STATUS,
          onChange: (value) => onChange("paymentStatus", value),
        },
      ]}
      summaryItems={(data) => [
        { label: "Finalized", value: String(data.summary.finalized) },
        { label: "Gross Salary", value: formatInr(data.summary.grossSalary) },
        { label: "Bonus", value: formatInr(data.summary.bonus) },
        { label: "Deductions", value: formatInr(data.summary.deductions) },
        { label: "Advance Deduction", value: formatInr(data.summary.advanceDeduction) },
        { label: "Final Salary", value: formatInr(data.summary.finalSalary) },
        { label: "Paid", value: formatInr(data.summary.paid) },
        { label: "Pending", value: formatInr(data.summary.pending) },
      ]}
      renderRow={(row, navigation) => (
        <ReportRow
          title={row.employeeName}
          meta={`${row.paymentStatus} · Bonus ${formatInr(row.bonus)} · Advance ${formatInr(row.advanceDeduction)}`}
          value={formatInr(row.finalSalary)}
          onPress={() => navigation.navigate("SalaryDetail", { salaryId: row.salaryId })}
        />
      )}
    />
  );
}

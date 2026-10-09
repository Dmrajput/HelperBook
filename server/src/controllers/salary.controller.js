import {
  calculateAllSalaries,
  calculateSalary,
  finalizeSalary,
  getEmployeeSalaryHistory,
  getMonthlySalaries,
  getSalaryById,
  recalculateSalary,
  reopenSalary,
  updateSalary,
} from "../services/salary.service.js";
import {
  getPayment,
  listPayments,
  paySalary,
  reversePayment,
  toPublicPayment,
} from "../services/salaryPayment.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import {
  parsePaymentId,
  validatePaySalary,
  validatePaymentListQuery,
  validateReversePayment,
} from "../validators/salaryPayment.validator.js";
import {
  parseEmployeeId,
  parseSalaryId,
  validateCalculate,
  validateCalculateAll,
  validateHistoryQuery,
  validateMonthParams,
  validateMonthQuery,
  validateSalaryUpdate,
} from "../validators/salary.validator.js";

export async function postCalculate(req, res) {
  const input = validateCalculate(req.body);
  const data = await calculateSalary(req.user.id, input);
  sendSuccess(res, "Salary calculated successfully", data);
}

export async function postCalculateAll(req, res) {
  const period = validateCalculateAll(req.body);
  const data = await calculateAllSalaries(req.user.id, period);
  sendSuccess(res, "Salaries calculated successfully", data);
}

export async function postRecalculate(req, res) {
  const salaryId = parseSalaryId(req.params.id);
  const input = req.body && Object.keys(req.body).length > 0 ? validateSalaryUpdate(req.body) : {};
  const data = await recalculateSalary(req.user.id, salaryId, input);
  sendSuccess(res, "Salary recalculated successfully", data);
}

export async function postFinalize(req, res) {
  const data = await finalizeSalary(req.user.id, parseSalaryId(req.params.id));
  sendSuccess(res, "Salary finalized successfully", data);
}

export async function postReopen(req, res) {
  const data = await reopenSalary(req.user.id, parseSalaryId(req.params.id));
  sendSuccess(res, "Salary reopened successfully", data);
}

export async function patchSalary(req, res) {
  const data = await updateSalary(req.user.id, parseSalaryId(req.params.id), validateSalaryUpdate(req.body));
  sendSuccess(res, "Salary updated successfully", data);
}

export async function getMonth(req, res) {
  const { year, month } = validateMonthParams(req.params.year, req.params.month);
  const data = await getMonthlySalaries(req.user.id, year, month, validateMonthQuery(req.query));
  sendSuccess(res, "Salaries fetched successfully", data);
}

export async function getEmployeeHistory(req, res) {
  const data = await getEmployeeSalaryHistory(
    req.user.id,
    parseEmployeeId(req.params.employeeId),
    validateHistoryQuery(req.query)
  );
  sendSuccess(res, "Salary history fetched successfully", data);
}

export async function getOne(req, res) {
  const data = await getSalaryById(req.user.id, parseSalaryId(req.params.id));
  sendSuccess(res, "Salary fetched successfully", data);
}

export async function postPaySalary(req, res) {
  const salaryId = parseSalaryId(req.params.id);
  const result = await paySalary(req.user.id, salaryId, validatePaySalary(req.body));
  const salary = await getSalaryById(req.user.id, String(result.salary._id));
  sendSuccess(
    res,
    "Salary payment recorded successfully.",
    { payment: toPublicPayment(result.payment), salary: salary.salary },
    result.replay ? 200 : 201
  );
}

export async function getPayments(req, res) {
  const data = await listPayments(req.user.id, validatePaymentListQuery(req.query));
  sendSuccess(res, "Salary payments fetched successfully", data);
}

export async function getPaymentDetail(req, res) {
  const data = await getPayment(req.user.id, parsePaymentId(req.params.paymentId));
  sendSuccess(res, "Salary payment fetched successfully", data);
}

export async function postReversePayment(req, res) {
  const result = await reversePayment(req.user.id, parsePaymentId(req.params.paymentId), validateReversePayment(req.body));
  const salary = await getSalaryById(req.user.id, String(result.salary._id));
  sendSuccess(res, "Salary payment reversed successfully.", {
    payment: toPublicPayment(result.payment),
    salary: salary.salary,
  });
}

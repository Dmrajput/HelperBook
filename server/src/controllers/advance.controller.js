import {
  getAdvance,
  getAdvanceTransactions,
  getEmployeeAdvances,
  getEmployeeTransactions,
  giveAdvance,
  listAdvances,
  recordAdjustment,
  recordRepayment,
  reverseTransaction,
  updateRepaymentSettings,
} from "../services/advance.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import {
  parseAdvanceId,
  parseEmployeeId,
  parseTransactionId,
  validateAdjustment,
  validateAdvanceListQuery,
  validateEmployeeAdvanceQuery,
  validateGiveAdvance,
  validateRepayment,
  validateRepaymentSettings,
  validateTransactionQuery,
} from "../validators/advance.validator.js";

export async function postAdvance(req, res) {
  const data = await giveAdvance(req.user.id, validateGiveAdvance(req.body));
  sendSuccess(res, "Advance recorded successfully", data, 201);
}

export async function postRepayment(req, res) {
  const data = await recordRepayment(req.user.id, validateRepayment(req.body));
  sendSuccess(res, "Repayment recorded successfully", data, 201);
}

export async function postAdjustment(req, res) {
  const data = await recordAdjustment(req.user.id, validateAdjustment(req.body));
  sendSuccess(res, "Adjustment recorded successfully", data, 201);
}

export async function postReverse(req, res) {
  const data = await reverseTransaction(req.user.id, parseTransactionId(req.params.transactionId));
  sendSuccess(res, "Transaction reversed successfully", data);
}

export async function getList(req, res) {
  const data = await listAdvances(req.user.id, validateAdvanceListQuery(req.query));
  sendSuccess(res, "Advances fetched successfully", data);
}

export async function getOne(req, res) {
  const data = await getAdvance(req.user.id, parseAdvanceId(req.params.id));
  sendSuccess(res, "Advance fetched successfully", data);
}

export async function getForEmployee(req, res) {
  const data = await getEmployeeAdvances(
    req.user.id,
    parseEmployeeId(req.params.employeeId),
    validateEmployeeAdvanceQuery(req.query)
  );
  sendSuccess(res, "Employee advances fetched successfully", data);
}

export async function getTransactionsForEmployee(req, res) {
  const data = await getEmployeeTransactions(
    req.user.id,
    parseEmployeeId(req.params.employeeId),
    validateTransactionQuery(req.query)
  );
  sendSuccess(res, "Khata history fetched successfully", data);
}

export async function getTransactionsForAdvance(req, res) {
  const data = await getAdvanceTransactions(
    req.user.id,
    parseAdvanceId(req.params.id),
    validateTransactionQuery(req.query)
  );
  sendSuccess(res, "Advance transactions fetched successfully", data);
}

export async function patchSettings(req, res) {
  const data = await updateRepaymentSettings(
    req.user.id,
    parseAdvanceId(req.params.id),
    validateRepaymentSettings(req.body)
  );
  sendSuccess(res, "Repayment settings updated successfully", data);
}

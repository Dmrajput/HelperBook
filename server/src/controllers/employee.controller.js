import {
  createEmployee as createEmployeeRecord,
  deleteEmployee as deleteEmployeeRecord,
  getEmployeeById as findEmployee,
  getEmployees as listEmployees,
  issueEmployeeTemporaryPassword,
  updateEmployee as updateEmployeeRecord,
  updateEmployeeStatus as updateStatusRecord,
  setEmployeeLoginStatus,
} from "../services/employee.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import {
  validateEmployeePayload,
  validateEmployeeQuery,
  validateEmployeeStatus,
  validateEmployeeUpdatePayload,
} from "../validators/employee.validator.js";

export async function createEmployee(req, res) {
  const payload = validateEmployeePayload(req.body, { requirePhone: true, allowStatus: true });
  const data = await createEmployeeRecord(req.user.id, payload);
  const message = data.temporaryPassword
    ? "Employee added. Share the temporary password securely."
    : "Employee added successfully.";
  sendSuccess(res, message, data, 201);
}

export async function getEmployees(req, res) {
  const query = validateEmployeeQuery(req.query);
  const data = await listEmployees(req.user.id, query);
  sendSuccess(res, "Employees fetched successfully", data);
}

export async function getEmployee(req, res) {
  const employee = await findEmployee(req.user.id, req.params.id);
  sendSuccess(res, "Employee fetched successfully", { employee });
}

export async function updateEmployee(req, res) {
  const payload = validateEmployeeUpdatePayload(req.body);
  const employee = await updateEmployeeRecord(req.user.id, req.params.id, payload);
  sendSuccess(res, "Employee updated successfully.", { employee });
}

export async function updateEmployeeStatus(req, res) {
  const status = validateEmployeeStatus(req.body);
  const employee = await updateStatusRecord(req.user.id, req.params.id, status);
  const message =
    status === "active" ? "Employee reactivated successfully." : "Employee deactivated successfully.";
  sendSuccess(res, message, { employee });
}

export async function updateEmployeeLoginStatus(req, res) {
  if (!req.body || typeof req.body.loginEnabled !== "boolean") {
    const { AppError } = await import("../utils/appError.js");
    throw new AppError("Please choose whether login should be enabled.", 400);
  }
  const data = await setEmployeeLoginStatus(req.user.id, req.params.id, req.body.loginEnabled);
  const message = !data.loginEnabled
    ? "Employee login disabled."
    : data.temporaryPassword
      ? "Employee login enabled. Share the temporary password securely."
      : "Employee login enabled.";
  sendSuccess(res, message, data);
}

export async function resetEmployeePassword(req, res) {
  const data = await issueEmployeeTemporaryPassword(req.user.id, req.params.id);
  sendSuccess(res, "Temporary password issued. Share it securely with the employee.", data);
}

export async function deleteEmployee(req, res) {
  await deleteEmployeeRecord(req.user.id, req.params.id);
  sendSuccess(res, "Employee deleted successfully.", null);
}

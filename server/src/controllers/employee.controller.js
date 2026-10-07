import {
  createEmployee as createEmployeeRecord,
  deleteEmployee as deleteEmployeeRecord,
  getEmployeeById as findEmployee,
  getEmployees as listEmployees,
  updateEmployee as updateEmployeeRecord,
  updateEmployeeStatus as updateStatusRecord,
} from "../services/employee.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import {
  validateEmployeePayload,
  validateEmployeeQuery,
  validateEmployeeStatus,
} from "../validators/employee.validator.js";

export async function createEmployee(req, res) {
  const payload = validateEmployeePayload(req.body);
  const employee = await createEmployeeRecord(req.user.id, payload);
  sendSuccess(res, "Employee added successfully.", { employee }, 201);
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
  const payload = validateEmployeePayload(req.body);
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

export async function deleteEmployee(req, res) {
  await deleteEmployeeRecord(req.user.id, req.params.id);
  sendSuccess(res, "Employee deleted successfully.", null);
}

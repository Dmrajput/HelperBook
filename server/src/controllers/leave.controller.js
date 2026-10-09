import {
  approveLeave,
  cancelLeave,
  createLeave,
  getEmployeeLeaves,
  getLeave,
  getLeaveHistory,
  listLeaves,
  recordLeave,
  rejectLeave,
} from "../services/leave.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import {
  parseLeaveIdParam,
  validateApproveLeave,
  validateCreateLeave,
  validateEmployeeLeaveQuery,
  validateHistoryQuery,
  validateLeaveListQuery,
  validateRecordLeave,
  validateRejectLeave,
} from "../validators/leave.validator.js";

export async function postLeave(req, res) {
  const data = await createLeave(req.user.id, validateCreateLeave(req.body));
  sendSuccess(res, "Leave request created successfully", data, 201);
}

export async function postRecordLeave(req, res) {
  const data = await recordLeave(req.user.id, validateRecordLeave(req.body));
  sendSuccess(res, "Leave recorded successfully", data, 201);
}

export async function getLeaves(req, res) {
  const data = await listLeaves(req.user.id, validateLeaveListQuery(req.query));
  sendSuccess(res, "Leave requests fetched successfully", data);
}

export async function getHistory(req, res) {
  const data = await getLeaveHistory(req.user.id, validateHistoryQuery(req.query));
  sendSuccess(res, "Leave history fetched successfully", data);
}

export async function getForEmployee(req, res) {
  const data = await getEmployeeLeaves(
    req.user.id,
    req.params.employeeId,
    validateEmployeeLeaveQuery(req.query)
  );
  sendSuccess(res, "Employee leave fetched successfully", data);
}

export async function getOne(req, res) {
  const data = await getLeave(req.user.id, parseLeaveIdParam(req.params.id));
  sendSuccess(res, "Leave fetched successfully", data);
}

export async function postApprove(req, res) {
  const data = await approveLeave(req.user.id, parseLeaveIdParam(req.params.id), validateApproveLeave(req.body));
  sendSuccess(res, "Leave approved successfully", data);
}

export async function postReject(req, res) {
  const data = await rejectLeave(req.user.id, parseLeaveIdParam(req.params.id), validateRejectLeave(req.body));
  sendSuccess(res, "Leave rejected.", data);
}

export async function postCancel(req, res) {
  const data = await cancelLeave(req.user.id, parseLeaveIdParam(req.params.id));
  sendSuccess(res, "Leave cancelled.", data);
}

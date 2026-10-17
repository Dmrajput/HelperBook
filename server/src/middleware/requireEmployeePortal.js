import { assertEmployeePasswordReady } from "../services/employeeAuth.service.js";

/** Blocks employee portal APIs until the temporary password has been changed. */
export function requireEmployeePortal(req, res, next) {
  try {
    assertEmployeePasswordReady(req.employee);
    next();
  } catch (error) {
    next(error);
  }
}

import { sendFailure } from "../utils/apiResponse.js";

export function notFound(req, res) {
  sendFailure(res, "API endpoint not found", 404);
}

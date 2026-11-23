import { sendSuccess } from "../utils/apiResponse.js";
import {
  getPublicPlans,
  getPublicPlatform,
  submitDemoRequest,
  submitInquiry,
} from "../services/marketingLead.service.js";

function clientMeta(req) {
  return {
    ip: String(req.ip || "").replace("::ffff:", ""),
    userAgent: req.get("user-agent") || "",
  };
}

export async function publicPlatform(req, res) {
  sendSuccess(res, "Platform details fetched.", await getPublicPlatform());
}

export async function publicPlans(req, res) {
  sendSuccess(res, "Plans fetched.", await getPublicPlans());
}

export async function createDemoRequest(req, res) {
  const result = await submitDemoRequest(req.body, clientMeta(req));
  sendSuccess(
    res,
    result.duplicate
      ? "Your demo request was already received."
      : "Your demo request has been received. Our team will contact you to confirm a suitable time.",
    result,
    result.duplicate ? 200 : 201
  );
}

export async function createInquiry(req, res) {
  const result = await submitInquiry(req.body, clientMeta(req));
  sendSuccess(
    res,
    result.duplicate ? "Your inquiry was already received." : "Your inquiry has been received.",
    result,
    result.duplicate ? 200 : 201
  );
}

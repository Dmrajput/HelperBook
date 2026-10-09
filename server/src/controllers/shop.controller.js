import {
  createShop as createShopRecord,
  getMyShop as findMyShop,
  removeShopLogo,
  saveShopLogo,
  updateLeaveSettings,
  updateMyShop as updateShopRecord,
} from "../services/shop.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/appError.js";
import { validateShopPayload, validateSickLeaveTreatment } from "../validators/shop.validator.js";

function requestOrigin(req) {
  const forwarded = req.get("x-forwarded-proto");
  const proto = forwarded ? forwarded.split(",")[0].trim() : req.protocol;
  return `${proto}://${req.get("host")}`;
}

export async function createShop(req, res) {
  const payload = validateShopPayload(req.body);
  const shop = await createShopRecord(req.user.id, payload);
  sendSuccess(res, "Shop created successfully", { shop }, 201);
}

export async function getMyShop(req, res) {
  const shop = await findMyShop(req.user.id);
  if (!shop) {
    sendSuccess(res, "No shop found", { shop: null });
    return;
  }
  sendSuccess(res, "Shop fetched successfully", { shop });
}

export async function updateMyShop(req, res) {
  const payload = validateShopPayload(req.body);
  const shop = await updateShopRecord(req.user.id, payload);
  sendSuccess(res, "Shop updated successfully", { shop });
}

export async function patchLeaveSettings(req, res) {
  const shop = await updateLeaveSettings(req.user.id, validateSickLeaveTreatment(req.body));
  sendSuccess(res, "Leave settings updated successfully", { shop });
}

export async function uploadLogo(req, res) {
  if (!req.file) {
    throw new AppError("Choose a logo image.", 400);
  }

  const shop = await saveShopLogo(req.user.id, req.file, requestOrigin(req));
  sendSuccess(res, "Shop logo updated", { shop });
}

export async function deleteLogo(req, res) {
  const shop = await removeShopLogo(req.user.id);
  sendSuccess(res, "Shop logo removed", { shop });
}

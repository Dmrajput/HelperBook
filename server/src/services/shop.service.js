import Shop from "../models/Shop.js";
import User from "../models/User.js";
import { getImageStorage } from "./storage/storage.provider.js";
import { AppError } from "../utils/appError.js";
import { startTrialForNewShop } from "./subscription.service.js";
import { assertLogoFile } from "../utils/imageFile.js";

const SHOP_EXISTS = "A shop already exists for this account.";
const SHOP_REQUIRED = "Create your shop before updating it.";
const LOGO_FAILED = "Unable to upload logo. Please try again.";

function duplicateShopError(error) {
  return Number(error?.code) === 11000;
}

async function requireOwner(userId) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new AppError("Account is inactive. Please contact support.", 403);
  }
  return user;
}

export function toPublicShop(shop, user) {
  return {
    id: String(shop._id),
    name: shop.name,
    businessType: shop.businessType,
    customBusinessType: shop.customBusinessType || "",
    logo: shop.logo?.url
      ? {
          url: shop.logo.url,
          uploadedAt: shop.logo.uploadedAt,
        }
      : null,
    owner: {
      fullName: shop.owner.fullName,
      email: shop.owner.email || "",
      phoneNumber: `${user.countryCode}${user.phoneNumber}`,
    },
    contact: {
      shopPhone: shop.contact?.shopPhone || "",
      email: shop.contact?.email || "",
    },
    address: {
      addressLine1: shop.address.addressLine1,
      addressLine2: shop.address.addressLine2 || "",
      city: shop.address.city,
      state: shop.address.state,
      pincode: shop.address.pincode,
      country: shop.address.country,
    },
    workingSchedule: {
      workingDays: shop.workingSchedule.workingDays,
      startTime: shop.workingSchedule.startTime,
      endTime: shop.workingSchedule.endTime,
    },
    settings: {
      currency: shop.settings.currency,
      timezone: shop.settings.timezone,
      language: shop.settings.language,
      attendanceDeductionMode: shop.settings.attendanceDeductionMode || "working_days",
      leaveSettings: {
        sickLeaveTreatment: shop.settings.leaveSettings?.sickLeaveTreatment === "paid" ? "paid" : "unpaid",
      },
    },
    isActive: shop.isActive,
    createdAt: shop.createdAt,
    updatedAt: shop.updatedAt,
  };
}

async function saveOwnerName(user, fullName) {
  if (user.fullName === fullName) {
    return user;
  }

  user.fullName = fullName;
  await user.save();
  return user;
}

export async function createShop(userId, payload) {
  const user = await requireOwner(userId);
  const existing = await Shop.findOne({ ownerId: user._id });
  if (existing) {
    throw new AppError(SHOP_EXISTS, 409);
  }

  try {
    const shop = await Shop.create({
      ownerId: user._id,
      ...payload,
    });
    await saveOwnerName(user, payload.owner.fullName);
    try {
      await startTrialForNewShop(user._id, shop);
    } catch (trialError) {
      console.error("Trial setup failed.", trialError?.message || "unknown");
    }
    return toPublicShop(shop, user);
  } catch (error) {
    if (duplicateShopError(error)) {
      throw new AppError(SHOP_EXISTS, 409);
    }
    throw error;
  }
}

export async function getMyShop(userId) {
  const user = await requireOwner(userId);
  const shop = await Shop.findOne({ ownerId: user._id });
  if (!shop) {
    return null;
  }
  return toPublicShop(shop, user);
}

export async function updateMyShop(userId, payload) {
  const user = await requireOwner(userId);
  const shop = await Shop.findOne({ ownerId: user._id });
  if (!shop) {
    throw new AppError(SHOP_REQUIRED, 404);
  }

  shop.name = payload.name;
  shop.businessType = payload.businessType;
  shop.customBusinessType = payload.customBusinessType;
  shop.owner = payload.owner;
  shop.contact = payload.contact;
  shop.address = payload.address;
  shop.workingSchedule = payload.workingSchedule;
  shop.settings = {
    ...payload.settings,
    attendanceDeductionMode: shop.settings?.attendanceDeductionMode || "working_days",
    leaveSettings: {
      sickLeaveTreatment: shop.settings?.leaveSettings?.sickLeaveTreatment === "paid" ? "paid" : "unpaid",
    },
  };
  await shop.save();
  await saveOwnerName(user, payload.owner.fullName);
  return toPublicShop(shop, user);
}

export async function updateLeaveSettings(userId, sickLeaveTreatment) {
  const user = await requireOwner(userId);
  const shop = await Shop.findOne({ ownerId: user._id, isActive: true });
  if (!shop) {
    throw new AppError(SHOP_REQUIRED, 404);
  }
  shop.settings.leaveSettings = { sickLeaveTreatment };
  shop.markModified("settings");
  await shop.save();
  return toPublicShop(shop, user);
}

export async function deleteMyShop(userId) {
  const user = await requireOwner(userId);
  const shop = await Shop.findOne({ ownerId: user._id });
  if (!shop) {
    throw new AppError("No shop found.", 404);
  }

  shop.isActive = false;
  await shop.save();
  return toPublicShop(shop, user);
}

async function requireShop(userId) {
  const user = await requireOwner(userId);
  const shop = await Shop.findOne({ ownerId: user._id });
  if (!shop) {
    throw new AppError("Create your shop before uploading a logo.", 404);
  }
  return { user, shop };
}

export async function saveShopLogo(userId, file, origin) {
  const { user, shop } = await requireShop(userId);
  const mimeType = assertLogoFile(file);
  const storage = getImageStorage();
  const previousId = shop.logo?.publicId || "";
  let uploaded;

  try {
    uploaded = await storage.upload({ buffer: file.buffer, mimeType, origin });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(LOGO_FAILED, 503, true);
  }

  shop.logo = uploaded;

  try {
    await shop.save();
  } catch (error) {
    await storage.remove(uploaded.publicId).catch(() => {});
    throw error;
  }

  if (previousId && previousId !== uploaded.publicId) {
    try {
      await storage.remove(previousId);
    } catch (error) {
      console.error(error instanceof AppError ? error.message : "Old logo cleanup failed");
    }
  }

  return toPublicShop(shop, user);
}

export async function removeShopLogo(userId) {
  const { user, shop } = await requireShop(userId);
  const previousId = shop.logo?.publicId || "";

  if (previousId) {
    try {
      await getImageStorage().remove(previousId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(LOGO_FAILED, 503, true);
    }
  }

  shop.logo = null;
  await shop.save();
  return toPublicShop(shop, user);
}

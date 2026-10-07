import mongoose from "mongoose";
import { BUSINESS_TYPES, DEFAULT_SETTINGS, WEEKDAYS } from "../constants/shop.js";

const logoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
    uploadedAt: { type: Date, required: true },
  },
  { _id: false }
);

const ownerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, default: "", trim: true, maxlength: 254 },
  },
  { _id: false }
);

const contactSchema = new mongoose.Schema(
  {
    shopPhone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true, maxlength: 254 },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    addressLine1: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
    addressLine2: { type: String, default: "", trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    state: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: "India" },
  },
  { _id: false }
);

const workingScheduleSchema = new mongoose.Schema(
  {
    workingDays: {
      type: [{ type: String, enum: WEEKDAYS }],
      required: true,
      validate: {
        validator(days) {
          return Array.isArray(days) && days.length > 0;
        },
        message: "Select at least one working day.",
      },
    },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    currency: { type: String, required: true, default: DEFAULT_SETTINGS.currency, enum: ["INR"] },
    timezone: {
      type: String,
      required: true,
      default: DEFAULT_SETTINGS.timezone,
      enum: ["Asia/Kolkata"],
    },
    language: { type: String, required: true, default: DEFAULT_SETTINGS.language, enum: ["en"] },
  },
  { _id: false }
);

const shopSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    businessType: { type: String, required: true, enum: BUSINESS_TYPES },
    customBusinessType: { type: String, default: null, trim: true, maxlength: 80 },
    logo: { type: logoSchema, default: null },
    owner: { type: ownerSchema, required: true },
    contact: { type: contactSchema, required: true },
    address: { type: addressSchema, required: true },
    workingSchedule: { type: workingScheduleSchema, required: true },
    settings: { type: settingsSchema, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Shop = mongoose.model("Shop", shopSchema);

export default Shop;

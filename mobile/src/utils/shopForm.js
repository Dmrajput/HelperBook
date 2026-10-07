import { WEEKDAYS } from "../constants/shop";

const WEEKDAY_IDS = WEEKDAYS.map((day) => day.id);

export function createEmptyShopForm() {
  return {
    name: "",
    businessType: "",
    customBusinessType: "",
    ownerName: "",
    ownerEmail: "",
    shopPhone: "",
    shopEmail: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    startTime: "09:00",
    endTime: "20:00",
    logo: null,
  };
}

export function formFromShop(shop) {
  return {
    name: shop?.name || "",
    businessType: shop?.businessType || "",
    customBusinessType: shop?.customBusinessType || "",
    ownerName: shop?.owner?.fullName || "",
    ownerEmail: shop?.owner?.email || "",
    shopPhone: shop?.contact?.shopPhone || "",
    shopEmail: shop?.contact?.email || "",
    addressLine1: shop?.address?.addressLine1 || "",
    addressLine2: shop?.address?.addressLine2 || "",
    city: shop?.address?.city || "",
    state: shop?.address?.state || "",
    pincode: shop?.address?.pincode || "",
    workingDays: shop?.workingSchedule?.workingDays || [],
    startTime: shop?.workingSchedule?.startTime || "09:00",
    endTime: shop?.workingSchedule?.endTime || "20:00",
    logo: shop?.logo?.url ? { uri: shop.logo.url, remote: true } : null,
  };
}

export function buildShopPayload(form) {
  return {
    name: form.name.trim(),
    businessType: form.businessType,
    customBusinessType: form.businessType === "Other" ? form.customBusinessType.trim() : "",
    owner: {
      fullName: form.ownerName.trim(),
      email: form.ownerEmail.trim(),
    },
    contact: {
      shopPhone: form.shopPhone.trim(),
      email: form.shopEmail.trim(),
    },
    address: {
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      country: "India",
    },
    workingSchedule: {
      workingDays: WEEKDAY_IDS.filter((day) => form.workingDays.includes(day)),
      startTime: form.startTime,
      endTime: form.endTime,
    },
  };
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function minutes(value) {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
}

export function validateShopStep(step, form) {
  const errors = {};

  if (step === 0) {
    const name = form.name.trim();
    if (!name) {
      errors.name = "Shop name is required.";
    } else if (name.length < 2 || name.length > 100) {
      errors.name = "Shop name must be between 2 and 100 characters.";
    }

    if (!form.businessType) {
      errors.businessType = "Please select a business type.";
    }

    if (form.businessType === "Other") {
      const custom = form.customBusinessType.trim();
      if (!custom) {
        errors.customBusinessType = "Please enter your business type.";
      } else if (custom.length < 2 || custom.length > 80) {
        errors.customBusinessType = "Business type must be between 2 and 80 characters.";
      }
    }
  }

  if (step === 1) {
    const ownerName = form.ownerName.trim();
    if (!ownerName) {
      errors.ownerName = "Please enter your name.";
    } else if (ownerName.length < 2 || ownerName.length > 100) {
      errors.ownerName = "Name must be between 2 and 100 characters.";
    }

    if (form.ownerEmail.trim() && !validEmail(form.ownerEmail.trim())) {
      errors.ownerEmail = "Please enter a valid email.";
    }

    if (form.shopPhone.trim() && !/^[6-9]\d{9}$/.test(form.shopPhone.trim())) {
      errors.shopPhone = "Enter a valid 10-digit mobile number.";
    }

    if (form.shopEmail.trim() && !validEmail(form.shopEmail.trim())) {
      errors.shopEmail = "Please enter a valid email.";
    }
  }

  if (step === 2) {
    if (form.addressLine1.trim().length < 2) {
      errors.addressLine1 = "Address is required.";
    }
    if (form.city.trim().length < 2) {
      errors.city = "City is required.";
    }
    if (form.state.trim().length < 2) {
      errors.state = "State is required.";
    }
    if (!/^[1-9]\d{5}$/.test(form.pincode.trim())) {
      errors.pincode = "Please enter a valid 6-digit pincode.";
    }
  }

  if (step === 3) {
    if (!form.workingDays.length) {
      errors.workingDays = "Select at least one working day.";
    }

    const validTime = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!validTime.test(form.startTime) || !validTime.test(form.endTime)) {
      errors.hours = "Please select valid working hours.";
    } else if (form.startTime === form.endTime) {
      errors.hours = "Opening and closing time cannot be the same.";
    } else if (minutes(form.endTime) < minutes(form.startTime)) {
      errors.hours = "Overnight working hours are not supported yet.";
    }
  }

  return errors;
}

export function validateMobile(value) {
  if (!value) {
    return "Enter your mobile number.";
  }
  if (!/^[6-9]\d{9}$/.test(value)) {
    return "Enter a valid 10-digit mobile number.";
  }
  return "";
}

export function validatePasswordRequired(value) {
  if (!value) {
    return "Enter your password.";
  }
  return "";
}

export function validatePasswordStrength(value) {
  if (!value || value.length < 8 || value.length > 64 || !/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return "Use 8 to 64 characters with a letter and a number.";
  }
  return "";
}

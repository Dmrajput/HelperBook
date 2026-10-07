function readPositiveInteger(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || String(raw).trim() === "") {
    return fallback;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    console.error(`${name} must be a positive integer.`);
    process.exit(1);
  }

  return value;
}

export function getAuthConfig() {
  return {
    otpProvider: process.env.OTP_PROVIDER,
    otpExpiryMinutes: readPositiveInteger("OTP_EXPIRY_MINUTES", 5),
    otpMaxAttempts: readPositiveInteger("OTP_MAX_ATTEMPTS", 5),
    otpResendCooldownSeconds: readPositiveInteger("OTP_RESEND_COOLDOWN_SECONDS", 30),
    otpMaxRequestsPerHour: readPositiveInteger("OTP_MAX_REQUESTS_PER_HOUR", 5),
    otpMaxIpRequestsPerHour: readPositiveInteger("OTP_MAX_IP_REQUESTS_PER_HOUR", 40),
    otpVerifyMaxPerWindow: readPositiveInteger("OTP_VERIFY_MAX_PER_WINDOW", 40),
    refreshMaxPerWindow: readPositiveInteger("REFRESH_MAX_PER_WINDOW", 60),
    maxActiveSessions: 5,
  };
}

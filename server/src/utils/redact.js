export function redactSensitive(value) {
  return String(value ?? "")
    .replace(/mongodb(\+srv)?:\/\/\S+/gi, "mongodb://[redacted]")
    .replace(/\/\/([^/\s:@]+):([^/\s@]+)@/g, "//[redacted]@")
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "Bearer [redacted]")
    .replace(/\[DEV OTP\][^\n]*/gi, "[DEV OTP] [redacted]");
}

export function redactSensitive(value) {
  return String(value ?? "")
    .replace(/mongodb(\+srv)?:\/\/\S+/gi, "mongodb://[redacted]")
    .replace(/\/\/([^/\s:@]+):([^/\s@]+)@/g, "//[redacted]@");
}

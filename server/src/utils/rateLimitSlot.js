import OtpRateLimit from "../models/OtpRateLimit.js";

/**
 * Shared sliding-window rate limit using the existing OtpRateLimit collection.
 * Returns true when the request is allowed.
 */
export async function takeSlot(key, max, windowMs) {
  const now = new Date();
  const windowStart = now.getTime() - windowMs;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      let record = await OtpRateLimit.findOne({ key });
      if (!record) {
        record = new OtpRateLimit({
          key,
          hits: [],
          expiresAt: new Date(now.getTime() + windowMs),
        });
      }

      record.hits = (record.hits || []).filter((hit) => new Date(hit).getTime() >= windowStart);
      record.markModified("hits");

      if (record.hits.length >= max) {
        return false;
      }

      record.hits.push(now);
      record.expiresAt = new Date(now.getTime() + windowMs);
      await record.save();
      return true;
    } catch (error) {
      if (error?.code === 11000 && attempt === 0) {
        continue;
      }
      throw error;
    }
  }

  return false;
}

import { randomBytes, randomInt } from "crypto";
import { AppError } from "./appError.js";

const TEMP_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const TEMP_DIGITS = "23456789";
const TEMP_ALPHABET = `${TEMP_LETTERS}${TEMP_DIGITS}`;
const TEMP_LENGTH = 12;

export function assertPasswordPolicy(password) {
  if (
    typeof password !== "string"
    || password.length < 8
    || password.length > 64
    || !/[A-Za-z]/.test(password)
    || !/\d/.test(password)
  ) {
    throw new AppError("Use 8 to 64 characters with at least one letter and one number.", 400);
  }
}

/** Cryptographically random temporary password that always meets the password policy. */
export function generateTemporaryPassword() {
  const bytes = randomBytes(TEMP_LENGTH);
  const chars = Array.from(bytes, (byte) => TEMP_ALPHABET[byte % TEMP_ALPHABET.length]);

  const letterIndex = randomInt(TEMP_LENGTH);
  chars[letterIndex] = TEMP_LETTERS[randomInt(TEMP_LETTERS.length)];

  let digitIndex = randomInt(TEMP_LENGTH);
  if (digitIndex === letterIndex) {
    digitIndex = (digitIndex + 1) % TEMP_LENGTH;
  }
  chars[digitIndex] = TEMP_DIGITS[randomInt(TEMP_DIGITS.length)];

  return chars.join("");
}

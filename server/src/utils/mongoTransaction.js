import mongoose from "mongoose";

function transactionsUnsupported(error) {
  const message = String(error?.message || "");
  return (
    message.includes("Transaction numbers are only allowed") ||
    message.includes("does not support retryable writes") ||
    message.includes("replica set") ||
    error?.codeName === "IllegalOperation"
  );
}

export async function runInTransaction(work) {
  let session;
  try {
    session = await mongoose.startSession();
  } catch (error) {
    if (transactionsUnsupported(error)) {
      return work(null);
    }
    throw error;
  }

  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (error) {
    if (transactionsUnsupported(error)) {
      return work(null);
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

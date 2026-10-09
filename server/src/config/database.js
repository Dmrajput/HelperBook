import mongoose from "mongoose";
import PushToken from "../models/PushToken.js";
import { redactSensitive } from "../utils/redact.js";

async function repairPushTokenIndexes() {
  const indexes = await PushToken.collection.indexes();
  const legacy = indexes.find((index) => index.name === "userId_1_deviceId_1" && !index.partialFilterExpression);
  if (legacy) {
    await PushToken.collection.dropIndex("userId_1_deviceId_1");
  }
  await PushToken.syncIndexes();
}

const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const databaseName = mongoose.connection.name;
    if (databaseName !== "helperbook") {
      console.error(
        `Refusing to use MongoDB database "${databaseName}". MONGODB_URI must select the helperbook database.`
      );
      await mongoose.disconnect();
      process.exit(1);
    }

    try {
      await repairPushTokenIndexes();
    } catch (error) {
      console.error("Push token index update failed:", redactSensitive(error.message));
    }
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", redactSensitive(error.message));
    process.exit(1);
  }
};

export default connectDatabase;

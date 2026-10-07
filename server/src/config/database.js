import mongoose from "mongoose";
import { redactSensitive } from "../utils/redact.js";

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

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", redactSensitive(error.message));
    process.exit(1);
  }
};

export default connectDatabase;

import mongoose from "mongoose";

const receiptCounterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    sequence: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

const ReceiptCounter = mongoose.model("ReceiptCounter", receiptCounterSchema);

export default ReceiptCounter;

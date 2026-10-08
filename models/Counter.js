import mongoose from "mongoose";

// Atomic sequence counters (used for human-friendly order numbers: ORD-1001, ORD-1002 ...)
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

export default Counter;

import { Schema, model } from "mongoose";

// Sequential numbers, incremented atomically. The first version numbered
// orders with countDocuments() + 1, which gave two orders placed at the same
// moment the same number.
const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter = model("Counter", counterSchema);

export async function nextSequence(name: string): Promise<number> {
  const counter = await Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return counter.seq;
}

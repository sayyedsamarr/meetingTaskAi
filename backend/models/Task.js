import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
    },
    actionItem: { type: String, required: true },
    owner: { type: String, default: "Unassigned" },
    deadline: { type: String, default: null }, // kept as free text + normalized ISO if resolvable
    deadlineISO: { type: Date, default: null },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    context: { type: String, default: "" }, // the source sentence(s) this was extracted from
    confidence: { type: Number, min: 0, max: 1, default: 0.5 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "done"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);

import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    title: { type: String, default: "Untitled Meeting" },
    transcript: { type: String, required: true },
    participantsHint: [{ type: String }], // names detected during preprocessing
    datesHint: [{ type: String }], // date phrases detected during preprocessing
    meetingDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Meeting", meetingSchema);

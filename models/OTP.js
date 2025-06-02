import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true, // Index for faster lookup
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: "10m" }, // Auto-delete after 10 minutes
  },
}, { timestamps: true });

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;
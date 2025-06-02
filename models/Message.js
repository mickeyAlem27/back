import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
  },
  image: {
    type: String,
  },
  seen: {
    type: Boolean,
    default: false,
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    default: null, // Points to the message being replied to
  },
  isDeleted: {
    type: Boolean,
    default: false, // For soft deletion
  },
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

export default Message;
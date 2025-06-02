import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { userSocketMap, io } from "../server.js";

export const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.id;

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
      isDeleted: false,
    })
      .populate("senderId", "-password")
      .populate("receiverId", "-password")
      .populate("replyTo", "text image senderId");

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, replyTo } = req.body;
    const senderId = req.user._id;
    const receiverId = req.params.id;

    const receiver = await User.findById(receiverId);
    if (receiver.blockedUsers.includes(senderId)) {
      return res.json({ success: false, message: "You are blocked by this user" });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    let replyToMessage = null;
    if (replyTo) {
      replyToMessage = await Message.findById(replyTo);
      if (!replyToMessage || replyToMessage.isDeleted) {
        return res.json({ success: false, message: "Replied message not found" });
      }
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      replyTo: replyToMessage?._id || null,
      seen: false, // Ensure new messages are marked unseen
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "-password")
      .populate("receiverId", "-password")
      .populate("replyTo", "text image senderId");

    // Emit to receiver
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", {
        message: populatedMessage,
        senderId: senderId.toString(),
        receiverId: receiverId.toString(),
      });
    }

    // Emit to sender (for their own UI update)
    const senderSocketId = userSocketMap[senderId];
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", {
        message: populatedMessage,
        senderId: senderId.toString(),
        receiverId: receiverId.toString(),
      });
    }

    res.json({ success: true, newMessage: populatedMessage });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.json({ success: false, message: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.json({ success: false, message: "Unauthorized to delete this message" });
    }

    message.isDeleted = true;
    await message.save();

    const receiverSocketId = userSocketMap[message.receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", messageId);
    }

    res.json({ success: true, message: "Message deleted" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .populate("contacts", "-password")
      .populate("blockedUsers", "-password");
    const filteredUsers = user.contacts;

    const blockedUserIds = user.blockedUsers.map((blockedUser) => blockedUser._id.toString());
    const usersWithStatus = filteredUsers.map((contact) => ({
      ...contact._doc,
      blocked: blockedUserIds.includes(contact._id.toString()),
      bio: contact.bio || "",
    }));

    const unseenMessages = {};
    const promises = filteredUsers.map(async (user) => {
      const messages = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
        isDeleted: false,
      });
      if (messages.length > 0) {
        unseenMessages[user._id] = messages.length;
      }
    });
    await Promise.all(promises);

    res.json({ success: true, users: usersWithStatus, unseenMessages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const markMessagesAsSeen = async (req, res) => {
  try {
    const messageId = req.params.id;
    await Message.findByIdAndUpdate(messageId, { seen: true });
    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// New endpoint to fetch unseen message counts
export const getUnseenMessagesCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const contacts = await User.findById(userId).populate("contacts", "_id");
    const unseenMessages = {};
    const promises = contacts.contacts.map(async (contact) => {
      const count = await Message.countDocuments({
        senderId: contact._id,
        receiverId: userId,
        seen: false,
        isDeleted: false,
      });
      if (count > 0) {
        unseenMessages[contact._id] = count;
      }
    });
    await Promise.all(promises);

    res.json({ success: true, unseenMessages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
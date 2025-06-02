import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
  sendMessage,
  getMessages,
  getUsersForSidebar,
  markMessagesAsSeen,
  deleteMessage,
  getUnseenMessagesCount, // Added
} from "../controllers/messageController.js";

const messageRouter = express.Router();

messageRouter.get("/users", protectRoute, getUsersForSidebar);
messageRouter.get("/unseen", protectRoute, getUnseenMessagesCount); // Added
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.post("/send/:id", protectRoute, sendMessage);
messageRouter.put("/mark/:id", protectRoute, markMessagesAsSeen);
messageRouter.delete("/:messageId", protectRoute, deleteMessage);

export default messageRouter;
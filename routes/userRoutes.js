import express from "express";
import { checkAuth, login, signup, updateProfile, addContact, removeContact, searchUsers, blockUser, unblockUser } from "../controllers/userController.js";
import { getMe, requestPasswordReset, resetPassword } from "../controllers/authController.js";
import { protectRoute } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.post("/request-password-reset", requestPasswordReset); // New route
userRouter.post("/reset-password", resetPassword); // New route
userRouter.put("/update-profile", protectRoute, updateProfile);
userRouter.get("/check", protectRoute, getMe);
userRouter.post("/add-contact", protectRoute, addContact);
userRouter.post("/remove-contact", protectRoute, removeContact);
userRouter.get("/search", protectRoute, searchUsers);
userRouter.post("/block-user", protectRoute, blockUser);
userRouter.post("/unblock-user", protectRoute, unblockUser);

export default userRouter;
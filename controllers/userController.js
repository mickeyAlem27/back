import { generateToken } from "../lib/utils.js";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";

// Signup a new user
export const signup = async (req, res) => {
  const { fullName, email, password, bio } = req.body;
  try {
    if (!fullName || !email || !password || !bio) {
      return res.json({ success: false, message: "All fields are required" });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.json({ success: false, message: "User already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      bio,
    });
    const token = generateToken(newUser._id);
    res.json({ success: true, userData: newUser, token, message: "Account created successfully" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Controller to login a user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email });
    if (!userData) {
      return res.json({ success: false, message: "Invalid credentials" });
    }
    const isPasswordCorrect = await bcrypt.compare(password, userData.password);
    if (!isPasswordCorrect) {
      return res.json({ success: false, message: "Invalid credentials" });
    }
    const token = generateToken(userData._id);
    res.json({ success: true, userData, token, message: "Login successful" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Controller to check if user is authenticated
export const checkAuth = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// Controller to update user profile
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName } = req.body;
    const userId = req.user._id;
    let updatedUser;
    if (!profilePic) {
      updatedUser = await User.findByIdAndUpdate(userId, { bio, fullName }, { new: true });
    } else {
      const upload = await cloudinary.uploader.upload(profilePic);
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: upload.secure_url, bio, fullName },
        { new: true }
      );
    }
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Search users by name or email
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user._id;

    if (!query) {
      return res.json({ success: true, users: [] });
    }

    const users = await User.find({
      $or: [
        { fullName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
      _id: { $ne: userId },
    }).select("-password");

    res.json({ success: true, users });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Add a contact
export const addContact = async (req, res) => {
  try {
    const { contactId } = req.body;
    const userId = req.user._id;

    // Check if the contact exists
    const contact = await User.findById(contactId);
    if (!contact) {
      return res.json({ success: false, message: "User not found" });
    }

    // Prevent adding self as a contact
    if (contactId.toString() === userId.toString()) {
      return res.json({ success: false, message: "Cannot add yourself as a contact" });
    }

    // Update the user's contacts
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { contacts: contactId } },
      { new: true }
    ).populate("contacts", "-password");

    res.json({ success: true, contacts: updatedUser.contacts });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Remove a contact
export const removeContact = async (req, res) => {
  try {
    const { contactId } = req.body;
    const userId = req.user._id;

    // Update the user's contacts by removing the contactId
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { contacts: contactId } },
      { new: true }
    ).populate("contacts", "-password");

    res.json({ success: true, contacts: updatedUser.contacts });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Block a user
export const blockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user._id;

    // Prevent blocking self
    if (userId.toString() === currentUserId.toString()) {
      return res.json({ success: false, message: "Cannot block yourself" });
    }

    // Check if the user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.json({ success: false, message: "User not found" });
    }

    // Add user to blockedUsers
    const updatedUser = await User.findByIdAndUpdate(
      currentUserId,
      { $addToSet: { blockedUsers: userId } },
      { new: true }
    ).populate("contacts", "-password").populate("blockedUsers", "-password");

    res.json({ success: true, contacts: updatedUser.contacts, blockedUsers: updatedUser.blockedUsers });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Unblock a user
export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
      currentUserId,
      { $pull: { blockedUsers: userId } },
      { new: true }
    ).populate("contacts", "-password").populate("blockedUsers", "-password");

    res.json({ success: true, contacts: updatedUser.contacts, blockedUsers: updatedUser.blockedUsers });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
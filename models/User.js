import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    validate: {
      validator: function (value) {
        // Requires at least one special character
        return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
      },
      message: 'Password must contain at least one special character (e.g., !@#$%^&*)'
    }
  
},
  profilePic: {
    type: String,
    default: "",
  },
  bio: {
    type: String,
  },
  contacts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  blockedUsers: [ // New field for blocked users
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;
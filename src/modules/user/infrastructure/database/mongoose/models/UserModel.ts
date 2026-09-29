import { Schema, model } from 'mongoose';

// Defines the MongoDB document structure for a User.
const userSchema = new Schema(
  {
    // User's name.
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // User's email address.
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // User's hashed password.
    password: {
      type: String,
      required: true,
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields.
    timestamps: true,
  }
);

// Mongoose model used by the User repository to interact with MongoDB.
export const UserModel = model('User', userSchema);

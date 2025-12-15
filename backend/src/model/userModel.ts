// src/model/user/userModel.ts
import mongoose, { Document, Schema } from "mongoose";

export interface LinkedDevice {
  sessionId: string;
  authenticated: boolean;
  authenticatedAt: Date;
  expiresAt: Date;
  accessToken?: string;
  refreshToken?: string;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: "admin" | "vendor" | "buyer";
  refreshToken?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  linkedDevices: LinkedDevice[];
  profileImage?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

const linkedDeviceSchema = new Schema<LinkedDevice>(
  {
    sessionId: { type: String, required: true },
    authenticated: { type: Boolean, default: true },
    authenticatedAt: { type: Date, default: Date.now },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL
    },
    accessToken: { type: String, default: null },
    refreshToken: { type: String, default: null },
  },
  { _id: false }
);

export type UserDocument = IUser & Document;

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    role: { type: String, enum: ["admin", "vendor", "buyer"], required: true },
    refreshToken: { type: String, default: null },
    profileImage: { type: String, default: null },

    addressLine1: { type: String, default: null, trim: true },
    addressLine2: { type: String, default: null, trim: true },
    city:        { type: String, default: null, trim: true },
    state:       { type: String, default: null, trim: true },
    postalCode:  { type: String, default: null, trim: true },
    country:     { type: String, default: null, trim: true },
    linkedDevices: { type: [linkedDeviceSchema], default: [] },
  },
  { timestamps: true }
);

const User = mongoose.model<UserDocument>("User", userSchema);
export default User;
export { User };

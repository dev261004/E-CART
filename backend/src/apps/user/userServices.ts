// src/apps/user/userServices.ts
import bcrypt from 'bcrypt';
import User, { UserDocument } from '../../model/userModel';
import messages from '../../utils/messages';
import AppError from "../../utils/AppError";
import { IUserSignup,UpdateProfilePayload,UpdateProfileResult } from '../../utils/typeAliases';
import mongoose from "mongoose"

//Create a new user (vendor or buyer)
export const createUser = async (data: IUserSignup): Promise<UserDocument> => {
  const { name, email, password, phoneNumber, role } = data;

  // Check if user already exists using exists()
  const isExists = await User.exists({ email });

  if (isExists) {
     throw new AppError(400, messages.ERROR.EMAIL_EXISTS, "email");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phoneNumber,
    role,
  });

  return user;
};

//Find user by email
export const findUserByEmail = async (email: string): Promise<UserDocument | null> => {
  return User.findOne({ email }).select('-createdAt -updatedAt -__v').exec();
};

export const logoutUser = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, messages.ERROR.USER_NOT_FOUND);
  }

  // Invalidate refresh token
  user.refreshToken = null;
  await user.save();

  return true;
};

export const getUserById = async (id: string): Promise<UserDocument | null> => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(400, messages.ERROR.USER_NOT_FOUND, "id");
  }

  const user = await User.findById(id)
    .select("-password -refreshToken -__v -createdAt -updatedAt")
    .exec();

  return user;
};


export const updateUserProfile = async (
  userId: string,
  payload: UpdateProfilePayload
): Promise<UpdateProfileResult | null> => {
  const update: any = {};

  if (payload.name !== undefined) update.name = payload.name;
  if (payload.phoneNumber !== undefined) update.phoneNumber = payload.phoneNumber;
  if (payload.profileImage !== undefined) update.profileImage = payload.profileImage;

  if (payload.addressLine1 !== undefined) update.addressLine1 = payload.addressLine1;
  if (payload.addressLine2 !== undefined) update.addressLine2 = payload.addressLine2;
  if (payload.city !== undefined) update.city = payload.city;
  if (payload.state !== undefined) update.state = payload.state;
  if (payload.postalCode !== undefined) update.postalCode = payload.postalCode;
  if (payload.country !== undefined) update.country = payload.country;

  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true, lean: true }      // 👈 important: lean() = plain object
  )
    .select("_id name email phoneNumber role profileImage addressLine1 addressLine2 city state postalCode country")
    .exec();

  return updated as UpdateProfileResult | null;
};

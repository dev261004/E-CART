// src/apps/user/userServices.ts
import bcrypt from 'bcrypt';
import User, { UserDocument } from '../../model/userModel';
import messages from '../../utils/messages';
import AppError from "../../utils/AppError";
import { IUserSignup } from '../../utils/typeAliases';
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
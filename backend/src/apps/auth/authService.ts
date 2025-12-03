// src/apps/auth/authService.ts
import jwt, { Secret,SignOptions ,TokenExpiredError}  from "jsonwebtoken";
import dayjs from "dayjs";
import bcrypt from "bcrypt";
import AppError from "../../utils/AppError";
import messages from "../../utils/messages";
import User from "../../model/userModel";
import { sendOtpEmail } from "../../services/emailService";
import {
  IForgotPasswordRequest,
  IResetPasswordRequest,
  IChangePasswordRequest,
  ResetPayload
} from "../../utils/typeAliases";


if (!process.env.RESET_PASSWORD_TOKEN_SECRET) {
  throw new Error("RESET_PASSWORD_TOKEN_SECRET is missing in env");
}
const RESET_SECRET: Secret = process.env.RESET_PASSWORD_TOKEN_SECRET;

const RESET_EXPIRES_IN = (
  process.env.RESET_PASSWORD_TOKEN_EXPIRES_IN ?? "10m"
) as SignOptions["expiresIn"];




const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
};

export const requestPasswordReset = async (payload: IForgotPasswordRequest) => {
  const { email } = payload;

  const user = await User.findOne({ email }).exec();
  if (!user) {
    throw new AppError(404, messages.ERROR.USER_NOT_FOUND, "email");
  }

  const otp = generateOtp();


  const jwtPayload: ResetPayload = { otp, email:user.email };
  const jwtOptions: SignOptions = { expiresIn: RESET_EXPIRES_IN };
  // create signed token with otp + email
  const resetToken = jwt.sign(jwtPayload, RESET_SECRET, jwtOptions);

  // send OTP by email
  await sendOtpEmail({
    to: user.email,
    name: user.name,
    otp,
  });

  // return token so frontend can store it (in memory / localStorage)
  return { resetToken };
};

export const resetPasswordWithOtp = async (payload: IResetPasswordRequest) => {
  const { email, otp, newPassword, resetToken } = payload;

  console.log("Reset payload received:", payload);      // 👈 add this
  console.log("Reset token received:", resetToken);     
  const user = await User.findOne({ email }).exec();
  if (!user) {
    throw new AppError(404, messages.ERROR.USER_NOT_FOUND, "email");
  }

  // 1) verify token
  let decoded: ResetPayload & { iat?: number; exp?: number }; // optional but nice for typing

  try {
    decoded = jwt.verify(resetToken, RESET_SECRET) as ResetPayload & {
      iat?: number;
      exp?: number;
    };
  } catch (err: any) {
    console.error("JWT verify error:", err.name, err.message);

    if (err instanceof TokenExpiredError) {
      // token really expired
      throw new AppError(400, messages.ERROR.OTP_EXPIRED, "otp");
    }

    // invalid signature, malformed token, etc.
    throw new AppError(400, messages.ERROR.INVALID_OTP, "otp");
  }

  console.log("Decoded reset token:", decoded);

  // 2) validate email + otp from token vs request
  if (!decoded || decoded.email !== email || decoded.otp !== otp) {
    throw new AppError(400, messages.ERROR.INVALID_OTP, "otp");
  }

  // 3) everything ok -> reset password
  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  await user.save();

  return true;
};



export const changePasswordWithOld = async (
  userId: string,
  payload: IChangePasswordRequest
): Promise<void> => {
  const { currentPassword, newPassword } = payload;

  const user = await User.findById(userId).exec();
  if (!user) {
    throw new AppError(404, messages.ERROR.USER_NOT_FOUND, "userId");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError(400, messages.ERROR.INVALID_OLD_PASSWORD, "currentPassword");
  }

  if (currentPassword === newPassword) {
    throw new AppError(400, messages.ERROR.PASSWORD_SAME_AS_OLD, "newPassword");
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;


  await user.save();
};
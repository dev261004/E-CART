// src/apps/user/userController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import AppError from '../../utils/AppError';
import createResponse from '../../utils/createResponse';
import messages from '../../utils/messages';
import { createLinkedDeviceSession } from "../../services/sessionService";
import { createUser, findUserByEmail, logoutUser, getUserById, updateUserProfile } from './userServices';
import { generateAccessToken, generateRefreshToken } from '../../services/tokenServices';
import { ApiResponse, IUserSignup, IUserLogin, UpdateProfileRequestBody, UpdateProfilePayload } from '../../utils/typeAliases';
import User, { UserDocument } from '../../model/userModel';
import { uploadToCloudinary } from '../../services/cloudinaryService';

export const signupController = async (
  req: Request<{}, ApiResponse, IUserSignup>,
  res: Response<ApiResponse>
) => {
  try {
    const payload = req.body;     
    console.log("Signup payload (backend):", payload);
    const user = await createUser(payload);

    const { password, refreshToken, ...safeUser } = user.toObject();

    // Encrypt success response (recommended)
    return await createResponse(
      res,
      201,
      messages.SUCCESS.USER_CREATED,
      { user: safeUser },
      true     // encrypt = true
    );
  } catch (err: any) {
    if (err instanceof AppError) {
      // For errors, you can choose encryption = false (easier to debug)
      return await createResponse(res, err.status, err.message, undefined, false);
    }

    console.error("signupController error:", err);

    return await createResponse(
      res,
      500,
      err.message || messages.ERROR.SERVER_ERROR,
      undefined,
      false    // plain error response
    );
  }
};


export const loginController = async (
  req: Request<{}, ApiResponse, IUserLogin>,
  res: Response<ApiResponse>
) => {
  try {
    // req.body is already decrypted if request was encrypted
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      throw new AppError(400, messages.ERROR.INVALID_CREDENTIALS);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError(400, messages.ERROR.INVALID_CREDENTIALS);
    }

    const userId = user._id.toString();

    // 1) create per-device session
    const sessionId = await createLinkedDeviceSession(user);

    // 2) generate tokens with sessionId
    const accessToken = generateAccessToken(userId, user.role, sessionId);
    const refreshToken = generateRefreshToken(userId, user.role, sessionId);

    const device = user.linkedDevices.find((d) => d.sessionId === sessionId);
    if (device) {
      device.accessToken = accessToken;   // store access token per session
      device.refreshToken = refreshToken;
    }

    user.refreshToken = refreshToken;
    await user.save();

    const { password: _p, refreshToken: _r, ...safeUser } = user.toObject();

    // Set cookie as before (not encrypted, cookie is separate)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 🔐 Encrypt success response body
    return await createResponse(
      res,
      200,
      messages.SUCCESS.LOGIN_SUCCESS,
      {
        user: safeUser,
        sessionId,
        accessToken
      },  
      true // encryption ON
    );
  } catch (err: any) {
    if (err instanceof AppError) {
      // For errors you can keep encryption OFF for now (debug-friendly)
      return await createResponse(res, err.status, err.message, undefined, false);
    }

    console.error("loginController error:", err);
    return await createResponse(
      res,
      400,
      err.message || messages.ERROR.SERVER_ERROR,
      undefined,
      false // plain error response
    );
  }
};


export const logoutController = async (
  req: Request,
  res: Response<ApiResponse>
) => {
  try {
    const authUser = req.user;
    if (!authUser) {
      throw new AppError(401, messages.ERROR.UNAUTHORIZED);
    }

    const { userId, sessionId } = authUser;

    const user = await User.findById(userId).exec();
    if (!user) {
      throw new AppError(404, messages.ERROR.USER_NOT_FOUND);
    }

    // 🔥 Remove ONLY this device's session
    user.linkedDevices = user.linkedDevices.filter(
      (d) => d.sessionId !== sessionId
    );

    await user.save();

    // 🔐 Clear refresh token cookie for THIS device
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });

    return await createResponse(
      res,
      200,
      messages.SUCCESS.LOGOUT_SUCCESS,
      undefined,
      true
    );
  } catch (err: any) {
    if (err instanceof AppError) {
      return await createResponse(
        res,
        err.status,
        err.message,
        undefined,
        false
      );
    }

    console.error("logoutController error:", err);
    return await createResponse(
      res,
      500,
      err.message || messages.ERROR.SERVER_ERROR,
      undefined,
      false
    );
  }
};




export const getProfileController = async (
  req: Request,
  res: Response<ApiResponse>
) => {
  try {
    const authUser = req.user;
    if (!authUser) {
      throw new AppError(401, messages.ERROR.UNAUTHORIZED);
    }

    const user = await getUserById(authUser.userId);
    if (!user) {
      throw new AppError(404, messages.ERROR.USER_NOT_FOUND);
    }

    // ✅ Explicit profile DTO – keeps it stable for frontend
    const profile = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,

      phoneNumber: user.phoneNumber ?? null,
      profileImage: user.profileImage ?? null,

      addressLine1: user.addressLine1 ?? "",
      addressLine2: user.addressLine2 ?? "",
      city: user.city ?? "",
      state: user.state ?? "",
      postalCode: user.postalCode ?? "",
      country: user.country ?? "",
    };

    return await createResponse(
      res,
      200,
      messages.SUCCESS.USER_PROFILE_FETCHED ?? "User profile fetched successfully",
      profile,
      true // encrypt response
    );
  } catch (err: any) {
    if (err instanceof AppError) {
      return await createResponse(res, err.status, err.message,undefined,false);
    }
    console.error("getProfileController error:", err);
    return await createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR,undefined,false);
  }
};


export const updateProfileController = async (
  req: Request<{}, ApiResponse, UpdateProfileRequestBody>,
  res: Response<ApiResponse>
) => {
  try {
    const authUser = req.user;
    if (!authUser || !authUser.userId) {
      throw new AppError(401, messages.ERROR.UNAUTHORIZED || "Unauthorized");
    }

    // body already validated & sanitized by validate(updateProfileValidation)
    const body = req.body;

    const removeAvatarFlag =
      body.removeAvatar === true || body.removeAvatar === "true";

    let profileImageUrl: string|null | undefined;

     if (removeAvatarFlag) {
      // Explicitly clear avatar
      profileImageUrl = null;
    } else if (req.file) {
      // New avatar uploaded -> upload to Cloudinary
      const uploadResult: any = await uploadToCloudinary(
        req.file.buffer,
        "user-avatars"
      );
      profileImageUrl = uploadResult.secure_url;
      // ⚠️ If you want to delete old Cloudinary image, you must store & use public_id.
    }

    const payload: UpdateProfilePayload = {
      ...body,
      // only include profileImage if we actually uploaded a new one
       profileImage: profileImageUrl,
    };

    if (profileImageUrl === undefined) {
      delete (payload as any).profileImage;
    }
    const updated = await updateUserProfile(authUser.userId, payload);

    return createResponse(
      res,
      200,
      "Profile updated successfully",
      updated,
      true // encrypt response
    );
  } catch (err: any) {
    if (err instanceof AppError) {
      return await createResponse(res, err.status, err.message,undefined,false);
    }
    console.error("updateProfileController error:", err);
    return await createResponse(
      res,
      500,
      err.message || messages.ERROR.SERVER_ERROR,
      undefined,
      false
    );
  }
};
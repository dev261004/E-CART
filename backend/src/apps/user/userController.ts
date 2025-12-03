// src/apps/user/userController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import AppError from '../../utils/AppError';
import createResponse from '../../utils/createResponse';
import messages from '../../utils/messages';
import { createLinkedDeviceSession } from "../../services/sessionService";
import { createUser, findUserByEmail, logoutUser, getUserById } from './userServices';
import { generateAccessToken, generateRefreshToken } from '../../services/tokenServices';
import { ApiResponse, IUserSignup, IUserLogin } from '../../utils/typeAliases';
import User, { UserDocument } from '../../model/userModel';

export const signupController = async (
  req: Request<{}, ApiResponse, IUserSignup>,
  res: Response<ApiResponse>
) => {
  try {
    const payload = req.body;
    const user = await createUser(payload);

    // remove sensitive fields
    const { password, refreshToken, ...safeUser } = user.toObject();

    return createResponse(res, 201, messages.SUCCESS.USER_CREATED, { user: safeUser });
  } catch (err: any) {
    if (err instanceof AppError) {
      return createResponse(res, err.status, err.message);
    }
    // fallback unexpected error
    console.error('signupController error:', err);
    return createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR);
  }
};

export const loginController = async (
  req: Request<{}, ApiResponse, IUserLogin>,
  res: Response<ApiResponse>
) => {
  try {
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
      device.accessToken = accessToken;   // 🔹 store access token in DB per session
    }

    // you can store refreshToken per user or in linkedDevices.encryptedPayload (future improvement)
    user.refreshToken = refreshToken;
    await user.save();

    const { password: _p, refreshToken: _r, ...safeUser } = user.toObject();
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      //secure: process.env.NODE_ENV === 'production', // true in prod
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (or match REFRESH_EXPIRES)
    });
    return createResponse(res, 200, messages.SUCCESS.LOGIN_SUCCESS, {
      accessToken,
      user: safeUser,
      sessionId
    });
  } catch (err: any) {
    if (err instanceof AppError) {
      return createResponse(res, err.status, err.message);
    }
    console.error("loginController error:", err);
    return createResponse(res, 400, err.message || messages.ERROR.SERVER_ERROR);
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

    // Remove ONLY this device's session from linkedDevices
    const beforeCount = user.linkedDevices.length;
    user.linkedDevices = user.linkedDevices.filter(
      (d) => d.sessionId !== sessionId
    );

    // Optional: If you want to clear refreshToken when no sessions left
    if (user.linkedDevices.length === 0) {
      user.refreshToken = null;
    }

    await user.save();

    // Optional: clear refreshToken cookie if you are using it
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });


    // If nothing was removed, it's still okay (idempotent logout)
    return createResponse(res, 200, messages.SUCCESS.LOGOUT_SUCCESS);
  } catch (err: any) {
    if (err instanceof AppError) {
      return createResponse(res, err.status, err.message);
    }
    console.error("logoutController error:", err);
    return createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR);
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

    const userObj = user.toObject();
    delete (userObj as Partial<UserDocument>).refreshToken;
    delete userObj.password;

    return createResponse(
      res,
      200,
      messages.SUCCESS.USER_PROFILE_FETCHED ?? "User profile fetched successfully",
      userObj
    );
  } catch (err: any) {
    if (err instanceof AppError) {
      return createResponse(res, err.status, err.message);
    }
    console.error("getProfileController error:", err);
    return createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR);
  }
};
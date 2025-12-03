// src/apps/auth/authController.ts
import { Request, Response } from "express";
import AppError from "../../utils/AppError";
import createResponse from "../../utils/createResponse";
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from "../../services/tokenServices";
import User from "../../model/userModel";
import messages from "../../utils/messages";
import {
  IForgotPasswordRequest,
  IResetPasswordRequest, ApiResponse, IResetRequest, IChangePasswordRequest, TRole
} from "../../utils/typeAliases";
import {
  requestPasswordReset,
  resetPasswordWithOtp,
  changePasswordWithOld

} from "./authService";



export const refreshTokenController = async (
  req: Request,
  res: Response<ApiResponse>
) => {
  try {
    const refreshToken =
      (req.cookies && (req.cookies.refreshToken as string)) ||
      (req.body && req.body.refreshToken);

    if (!refreshToken) {
      throw new AppError(401, messages.ERROR.UNAUTHORIZED);
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken); // { userId, role, sessionId, type }
    } catch {
      throw new AppError(401, messages.ERROR.INVALID_TOKEN);
    }

    const { userId, role, sessionId } = payload;

    const user = await User.findOne({
      _id: userId,
      "linkedDevices.sessionId": sessionId,
      "linkedDevices.authenticated": true
    }).exec();

    if (!user) {
      throw new AppError(401, messages.ERROR.INVALID_TOKEN);
    }

    const newAccessToken = generateAccessToken(userId, role as TRole, sessionId);
    const newRefreshToken = generateRefreshToken(userId, role as TRole, sessionId);

    const device = user.linkedDevices.find((d) => d.sessionId === sessionId);
    if (device) {
      device.accessToken = newAccessToken;
    }
    user.refreshToken = newRefreshToken;
    await user.save();
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return createResponse(res, 200, "Tokens refreshed", {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err: any) {
    if (err instanceof AppError) {
      return createResponse(res, err.status, err.message);
    }
    console.error("refreshTokenController error:", err);
    return createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR);
  }
};

// POST /api/auth/forgot-password
export const forgotPasswordController = async (
  req: Request<{}, ApiResponse, IForgotPasswordRequest>,
  res: Response<ApiResponse>
) => {
  try {
    const payload = req.body;
    const { resetToken } = await requestPasswordReset(payload);

    return createResponse(res, 200, messages.SUCCESS.OTP_SENT, {
      resetToken, 
    });
  } catch (err: any) {
    if (err instanceof AppError) {
      return createResponse(res, err.status, err.message);
    }
    console.error("forgotPasswordController error:", err);
    return createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR);
  }
};


// POST /api/auth/reset-password
export const resetPasswordController = async (
  req: Request<{}, ApiResponse, IResetPasswordRequest>,
  res: Response<ApiResponse>
) => {
  try {
    const payload = req.body;
    await resetPasswordWithOtp(payload);

    return createResponse(
      res,
      200,
      messages.SUCCESS.PASSWORD_RESET_SUCCESS
    );
  } catch (err: any) {
    if (err instanceof AppError) {
      return createResponse(res, err.status, err.message);
    }
    console.error("resetPasswordController error:", err);
    return createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR);
  }
};


export const resendOtpController = async (
  req: Request<{}, ApiResponse, IForgotPasswordRequest>,
  res: Response<ApiResponse>
) => {
  try {
    const payload = req.body; // { email }

    // Re-use the same service used by forgot-password
  const { resetToken } = await requestPasswordReset(payload);

    return createResponse(
      res,
      200,
      messages.SUCCESS.OTP_RESENT ?? messages.SUCCESS.OTP_SENT,
      { resetToken }
    );
  } catch (err: any) {
    if (err instanceof AppError) {
      return createResponse(res, err.status, err.message);
    }
    console.error("resendOtpController error:", err);
    return createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR);
  }
};


export const changePasswordController = async (
  req: Request<{}, ApiResponse, IChangePasswordRequest>,
  res: Response<ApiResponse>
) => {
  try {
    const authUser = req.user;
    if (!authUser) {
      throw new AppError(401, messages.ERROR.UNAUTHORIZED);
    }

    const userId = authUser.userId;
    const currentSessionId = authUser.sessionId;

    // 1) Change password
    await changePasswordWithOld(userId, req.body);

    // 2) Reload user
    const user = await User.findById(userId).exec();
    if (!user) {
      throw new AppError(404, messages.ERROR.USER_NOT_FOUND);
    }

    // 3) Keep ONLY this session
    user.linkedDevices = user.linkedDevices.filter(
      (d) => d.sessionId === currentSessionId
    );
    await user.save();

    // 4) Issue fresh tokens (same currentSessionId)
    const accessToken = generateAccessToken(userId, user.role, currentSessionId);
    const refreshToken = generateRefreshToken(userId, user.role, currentSessionId);

    user.refreshToken = refreshToken;
    await user.save();

    // ⬇️ IMPORTANT: update refresh cookie for THIS device
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return createResponse(res, 200, messages.SUCCESS.PASSWORD_CHANGED, {
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    if (err instanceof AppError) {
      return createResponse(res, err.status, err.message);
    }
    console.error("changePasswordController error:", err);
    return createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR);
  }
};

// src/controllers/authController.ts
export const sessionStatusController = (
  req: Request,
  res: Response<ApiResponse>
) => {
  // If we're here, auth middleware already validated user + sessionId
  const user = req.user!;

  return res.status(200).json({
    success: true,
    message: "Session active",
    data: {
      userId: user.userId,
      role: user.role,
    },
  });
};

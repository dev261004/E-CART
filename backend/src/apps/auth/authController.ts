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
      req.cookies?.refreshToken ||
      req.body?.refreshToken;

    if (!refreshToken) {
      throw new AppError(401, messages.ERROR.UNAUTHORIZED);
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
      if (payload.type && payload.type !== "refresh") {
        throw new AppError(401, messages.ERROR.INVALID_TOKEN);
      }
    } catch {
      throw new AppError(401, messages.ERROR.INVALID_TOKEN);
    }

    const { userId, role, sessionId } = payload;

    // 🔐 Validate refresh token against linkedDevices
    const user = await User.findOne({
      _id: userId,
      "linkedDevices.sessionId": sessionId,
      "linkedDevices.refreshToken": refreshToken,
      "linkedDevices.authenticated": true
    }).exec();

    if (!user) {
      throw new AppError(401, messages.ERROR.INVALID_TOKEN);
    }

    // ✅ OPTION A: ONLY generate new access token
    const newAccessToken = generateAccessToken(
      userId,
      role as TRole,
      sessionId
    );

    // ❌ NO refresh token rotation
    // ❌ NO cookie reset
    // ❌ NO DB update required

    return await createResponse(
      res,
      200,
      "Access token refreshed",
      { accessToken: newAccessToken },
      false
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

    console.error("refreshTokenController error:", err);
    return await createResponse(
      res,
      500,
      err.message || messages.ERROR.SERVER_ERROR,
      undefined,
      false
    );
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

    return await createResponse(res, 200, messages.SUCCESS.OTP_SENT, {
      resetToken,
    }, true);
  } catch (err: any) {
    if (err instanceof AppError) {
      return await createResponse(res, err.status, err.message, undefined, false);
    }
    console.error("forgotPasswordController error:", err);
    return await createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR, undefined, false);
  }
};


// POST /api/auth/reset-password
// POST /api/auth/reset-password
export const resetPasswordController = async (
  req: Request<{}, ApiResponse, IResetPasswordRequest>,
  res: Response<ApiResponse>
) => {
  try {
    const payload = req.body; // decrypted by decryptRequestBody if client sent { data: "<hex>" }
    await resetPasswordWithOtp(payload);

    // No payload to encrypt (only message). Keep encryption = false for clarity/debug.
    return await createResponse(
      res,
      200,
      messages.SUCCESS.PASSWORD_RESET_SUCCESS,
      undefined,
      false
    );
  } catch (err: any) {
    if (err instanceof AppError) {
      // send error as plain JSON (debug-friendly)
      return await createResponse(res, err.status, err.message, undefined, false);
    }
    console.error("resetPasswordController error:", err);
    return await createResponse(
      res,
      500,
      err.message || messages.ERROR.SERVER_ERROR,
      undefined,
      false
    );
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

    return await createResponse(
      res,
      200,
      messages.SUCCESS.OTP_RESENT ?? messages.SUCCESS.OTP_SENT,
      { resetToken },
      true
    );
  } catch (err: any) {
    if (err instanceof AppError) {
      return await createResponse(res, err.status, err.message, undefined, false);
    }
    console.error("resendOtpController error:", err);
    return await createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR, undefined, false);
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

    console.log("BEFORE filter", {
      currentSessionId,
      linkedDevices: user.linkedDevices.map(d => d.sessionId),
    });
    // 3) Keep ONLY this session
    user.linkedDevices = user.linkedDevices.filter(
      (d) => d.sessionId === currentSessionId
    );
    await user.save();

    //console.log("AFTER filter", user.linkedDevices.map(d => d.sessionId));

    // 4) Issue fresh tokens (same currentSessionId)
    const accessToken = generateAccessToken(userId, user.role, currentSessionId);
    const refreshToken = generateRefreshToken(userId, user.role, currentSessionId);

    const device = user.linkedDevices.find(
      (d) => d.sessionId === currentSessionId
    );
    if (device) {
      device.accessToken = accessToken;
    }

    user.refreshToken = refreshToken;
    await user.save();

    // ⬇️ IMPORTANT: update refresh cookie for THIS device
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return await createResponse(res, 200, messages.SUCCESS.PASSWORD_CHANGED, {
      accessToken,
      refreshToken,
    }, true);
  } catch (err: any) {
    if (err instanceof AppError) {
      return await createResponse(res, err.status, err.message, undefined, false);
    }
    console.error("changePasswordController error:", err);
    return await createResponse(res, 500, err.message || messages.ERROR.SERVER_ERROR, undefined, false);
  }
};

// src/controllers/authController.ts
// GET /api/auth/session-status
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
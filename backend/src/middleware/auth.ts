// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/tokenServices";
import messages from "../utils/messages";
import User from "../model/userModel";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        sessionId: string;
      };
    }
  }
}

const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: messages.ERROR.UNAUTHORIZED
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: messages.ERROR.UNAUTHORIZED
      });
    }

    const decoded = verifyAccessToken(token); // { userId, role, sessionId }

    const user = await User.findOne({
      _id: decoded.userId,
      "linkedDevices.sessionId": decoded.sessionId,
      "linkedDevices.authenticated": true
    }).exec();
    //console.log("Found user?", !!user);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: messages.ERROR.INVALID_TOKEN
      });
    }

    const device = user.linkedDevices.find(
      (d) => d.sessionId === decoded.sessionId
    );

    if (device?.accessToken && device.accessToken !== token) {
      // someone is using an old/rotated token
      return res.status(401).json({
        success: false,
        message: messages.ERROR.INVALID_TOKEN
      });
    }
    
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      sessionId: decoded.sessionId
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: messages.ERROR.INVALID_TOKEN
    });
  }
};

export default auth;

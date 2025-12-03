import { Request, Response, NextFunction } from 'express';
import messages from '../utils/messages';
import { TRole, ApiResponse } from '../utils/typeAliases';

export const allowRole = (role: TRole) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: messages.ERROR.UNAUTHORIZED
      });
    }

    if (user.role !== role) {
      return res.status(403).json({
        success: false,
        message: messages.ERROR.FORBIDDEN
      });
    }

    next();
  };
};

export const allowRoles = (roles: TRole[]) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: messages.ERROR.UNAUTHORIZED
      });
    }

    if (!roles.includes(user.role as TRole)) {
      return res.status(403).json({
        success: false,
        message: messages.ERROR.FORBIDDEN
      });
    }

    next();
  };
};

export default allowRole;

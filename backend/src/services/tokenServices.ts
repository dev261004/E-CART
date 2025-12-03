// src/services/tokenServices.ts

import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import {
  IAccessTokenPayload,
  IRefreshTokenPayload,
  TRole
} from '../utils/typeAliases';

// Secrets
const ACCESS_SECRET: Secret = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET!;

// Expiry durations
const ACCESS_EXPIRES: SignOptions["expiresIn"] =
  (process.env.ACCESS_TOKEN_EXPIRES ) as SignOptions["expiresIn"];

const REFRESH_EXPIRES: SignOptions["expiresIn"] =
  (process.env.REFRESH_TOKEN_EXPIRES ) as SignOptions["expiresIn"];

// Generate Access Token
export const generateAccessToken = (
  userId: string,
  role: TRole,
   sessionId: string
): string => {
  const payload: IAccessTokenPayload = { userId, role,sessionId };

  const options: SignOptions = {
    expiresIn: ACCESS_EXPIRES
  };

  return jwt.sign(payload, ACCESS_SECRET, options);
};


// Generate Refresh Token
export const generateRefreshToken = (userId: string,   role: string, sessionId: string): string => {
  const payload: IRefreshTokenPayload = { userId, role,sessionId , type: "refresh"};

  const options: SignOptions = {
    expiresIn: REFRESH_EXPIRES
  };

  return jwt.sign(payload, REFRESH_SECRET, options);
};


// Verify Access Token
export const verifyAccessToken = (token: string): IAccessTokenPayload => {
  return jwt.verify(token, ACCESS_SECRET) as IAccessTokenPayload;
};


// Verify Refresh Token
export const verifyRefreshToken = (token: string): IRefreshTokenPayload => {
  return jwt.verify(token, REFRESH_SECRET) as IRefreshTokenPayload;
};

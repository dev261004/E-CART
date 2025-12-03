// src/services/sessionService.ts
import { randomUUID } from "crypto";
import dayjs from "dayjs";
import User, { UserDocument } from "../model/userModel";

export const createLinkedDeviceSession = async (
  user: UserDocument
): Promise<string> => {
  const sessionId = randomUUID();
  const expiresAt = dayjs().add(7, "day").toDate(); // example session validity

  user.linkedDevices.push({
    sessionId,
    authenticated: true,
    authenticatedAt: new Date(),
    expiresAt
  });

  await user.save();
  return sessionId;
};

export const findActiveSession = async (
  userId: string,
  sessionId: string
): Promise<UserDocument | null> => {
  return User.findOne({
    _id: userId,
    "linkedDevices.sessionId": sessionId,
    "linkedDevices.authenticated": true
  }).exec();
};

export const keepOnlySession = async (
  user: UserDocument,
  keepSessionId: string
) => {
  user.linkedDevices = user.linkedDevices.filter(
    (d) => d.sessionId === keepSessionId
  );
  await user.save();
};

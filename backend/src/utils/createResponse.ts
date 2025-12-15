// src/utils/createResponse.ts
import { Response } from "express";
import { encrypt } from "../services/encryptDecrypt";
import { ApiResponse } from "./typeAliases";

const createResponse = async <T = any>(
  res: Response,
  status: number,
  message: string,
  payload?: T,
  encryption: boolean = true    // NEW flag
): Promise<Response<ApiResponse<T | string | null>>> => {
  const success = status >= 200 && status < 300;

  let responseData: T | string | null = null;

  if (payload !== undefined) {
    if (encryption) {
      try {
        const jsonString = JSON.stringify(payload);           // 1) stringify
        const encoded = encodeURIComponent(jsonString);       // 2) encode
        const encryptedHex = await encrypt(encoded);          // 3) encrypt → hex
        responseData = encryptedHex;
      } catch (err) {
        console.error("Failed to encrypt response:", err);
        responseData = null;
      }
    } else {
      responseData = payload; // plain JSON
    }
  }
//console.log("Response data on createResponse:", responseData);
  return res.status(status).json({
    success,
    message,
    data: responseData,
  });
};

export default createResponse;

// src/middleware/decryptRequestBody.ts
import { NextFunction, Request, Response } from "express";
import { decrypt } from "../services/encryptDecrypt";

export interface MulterAwareRequest extends Request {
  body: any;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

export const decryptRequestBody = async (
  req: MulterAwareRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const encryptedData = req.body?.data;
console.log("decryptRequestBody - encryptedData:", encryptedData);
    // If no encrypted data, skip - this allows plain JSON or already-processed bodies
    if (!encryptedData) return next();

    if (typeof encryptedData !== "string") {
      return res.status(400).json({ success: false, message: "Invalid encrypted payload" });
    }

    // decrypt -> gives encoded JSON string (because we encoded on encrypt)
   // console.log("middlware called");
    const decryptedEncoded = await decrypt(encryptedData);
    const decoded = decodeURIComponent(decryptedEncoded);
    const parsed = JSON.parse(decoded);

    // preserve files: if single file exists, keep info in parsed (like profileImage or avatar)
    // For files array (req.files as array), add an images array similar to mentor code
    const preservedFile = req.file;
    const preservedFiles = Array.isArray(req.files) ? req.files : undefined;

    // Replace req.body with parsed object
    req.body = parsed;

    // Reattach files so later middleware/controller can access them
    if (preservedFile) {
      req.file = preservedFile;
    }
    if (preservedFiles) {
      req.files = preservedFiles;
    }

    return next();
  } catch (err) {
    console.error("Failed to decrypt request body:", err);
    return res.status(400).json({ success: false, message: "Invalid encrypted payload" });
  }
};

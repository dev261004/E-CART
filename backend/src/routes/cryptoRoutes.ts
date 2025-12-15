import { Router, Request, Response } from "express";
import { encrypt, decrypt } from "../services/encryptDecrypt";

const router = Router();

/**
 * POST /crypto/encrypt
 * Body: { "text": "hello" }
 * Response: { "encrypted": "<hex>" }
 *
 * This is only for training & Postman testing.
 */

router.post("/encode", async (req, res) => {
  try {
    const json  = req.body;

    if (!json ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing 'json' field. It must be an object."
      });
    }

    // Convert the JSON object → JSON string (escaped format)
    const stringified = JSON.stringify(json);

    return res.json({
      success: true,
      text: stringified
    });

  } catch (err) {
    console.error("Stringify error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to stringify JSON."
    });}
});

router.post("/encrypt", async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (typeof text !== "string") {
      return res.status(400).json({ message: "text must be a string" });
    }

    // match our pipeline: encode → encrypt
    const encoded = encodeURIComponent(text);
    const encryptedHex = await encrypt(encoded);

    return res.json({ encrypted: encryptedHex });
  } catch (error) {
    console.error("Error in /crypto/encrypt:", error);
    return res.status(500).json({ message: "Encryption failed" });
  }
});

/**
 * POST /crypto/decrypt
 * Body: { "encrypted": "<hex>" }
 * Response: { "decrypted": "hello" }
 */
router.post("/decrypt", async (req: Request, res: Response) => {
  try {
    const { encrypted } = req.body;
    if (typeof encrypted !== "string") {
      return res.status(400).json({ message: "encrypted must be a string" });
    }

    const decryptedEncoded = await decrypt(encrypted);
    const decrypted = decodeURIComponent(decryptedEncoded);

   const obj = JSON.parse(decrypted);
return res.json({ decrypted, parsed: obj });

  } catch (error) {
    console.error("Error in /crypto/decrypt:", error);
    return res.status(500).json({ message: "Decryption failed" });
  }
});

export default router;

import crypto from "crypto";
import messages from "../utils/messages";
const algorithm = process.env.ENCRYPTION_ALGORITHM || "aes-256-cbc";

function getEncryptionKeyAndIv() {
  const keyHex = process.env.ENCRYPTION_KEY;
  const ivHex = process.env.ENCRYPTION_IV;

  if (!keyHex || !ivHex) {
    throw new Error(messages.ERROR.ENCRYPTION_ENV_VARS_MISSING);
  }

  const key = Buffer.from(keyHex, "hex"); // 32 bytes for AES-256
  const iv = Buffer.from(ivHex, "hex");   // 16 bytes for AES-CBC

  if (key.length !== 32) {
    throw new Error(messages.ERROR.ENCRYPTIION_KEY_LENGTH_INVALID);
  }
  if (iv.length !== 16) {
    throw new Error(messages.ERROR.ENCRYPTIION_IV_LENGTH_INVALID);
  }

  return { key, iv };
}


// Encrypts a UTF-8 string and returns HEX string
export async function encrypt(plainText: string): Promise<string> {
  const { key, iv } = getEncryptionKeyAndIv();

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(plainText, "utf8", "base64");

  encrypted += cipher.final("base64");

  return encrypted; // hex string
}

// Decrypts HEX string and returns UTF-8 string 
export async function decrypt(cipherHex: string): Promise<string> {
  const { key, iv } = getEncryptionKeyAndIv();

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(cipherHex, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted; // utf8 string
}

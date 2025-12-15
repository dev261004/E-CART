// src/utils/crypto.ts
import CryptoJS from "crypto-js";
import { getEnv } from "./env";

/**
 * AES-256-CBC ENCRYPT
 * - key, iv: HEX strings (same as backend)
 * - message: string (JSON string usually)
 * - output: HEX ciphertext (backend compatible)
 */
export function AES_256_CBC_encrypt(
  message: string,
  keyHex: string | undefined = getEnv("VITE_PUBLIC_AUTH_KEY"),
  ivHex: string | undefined = getEnv("VITE_PUBLIC_AUTH_IV")
): string {
  try {
    if (!keyHex || !ivHex) {
      console.error("[crypto] missing key/iv");
      return "";
    }

    // Debug (safe)
    console.log(
      "[crypto] using key head:",
      keyHex.slice(0, 8),
      "iv head:",
      ivHex.slice(0, 8)
    );

    // Backend expects encodeURIComponent before encryption
    const prepared = encodeURIComponent(message);

    const key = CryptoJS.enc.Hex.parse(keyHex);
    const iv = CryptoJS.enc.Hex.parse(ivHex);

    const encrypted = CryptoJS.AES.encrypt(prepared, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    // IMPORTANT: return raw ciphertext as HEX (not Base64)
    return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
  } catch (error) {
    console.error("[crypto] Failed to encrypt:", error);
    return "";
  }
}

/**
 * AES-256-CBC DECRYPT
 * - encryptedHex: HEX ciphertext
 * - returns UTF-8 plaintext string
 */
export function AES_256_CBC_decrypt(
  encryptedText: string,
  keyHex: string | undefined,
  ivHex: string | undefined
): string {
  try {
    if (!keyHex || !ivHex) {
      console.error("[crypto] missing key/iv");
      return "";
    }

    const key = CryptoJS.enc.Hex.parse(keyHex);
    const iv = CryptoJS.enc.Hex.parse(ivHex);

    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encryptedText)
    });

    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("[crypto] Failed to decrypt:", error);
    return "";
  }
}

/**
 * Decrypt API response → JSON
 */
export const getDecryptedData = (hexstring: string) => {
  try {
    const key = getEnv("VITE_PUBLIC_AUTH_KEY");
    const iv = getEnv("VITE_PUBLIC_AUTH_IV");

    if (!key || !iv) {
      throw new Error("Missing auth key/iv");
    }

    const decrypted = AES_256_CBC_decrypt(hexstring, key, iv);
    const decoded = decodeURIComponent(decrypted);
    return JSON.parse(decoded);
  } catch (error) {
    console.error("[crypto] Failed to getDecryptedData:", error);
  }
};


import { Router, Request, Response } from "express";
import createResponse from "../utils/createResponse";

const router = Router();

/**
 * POST /secure/test
 * If body is encrypted { data: "<hex>" }, it will be decrypted by decryptRequestBody.
 * If body is plain JSON, it's used as-is.
 */
router.post("/secure/test", async (req: Request, res: Response) => {
  // At this point, req.body is:
  // - decrypted object (if encrypted was sent)
  // - or plain JSON (if you didn't encrypt)
  const body = req.body;

  const user = {
    receivedBody: body,
    serverNote: "This was processed by secure test API",
  };


  // encryption = true (default) => response.data will be HEX
  return createResponse(res, 200, "Secure test successful", user, true);
});

export default router;

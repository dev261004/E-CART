// src/apps/auth/authRoute.ts
import { Router } from "express";
import validate from "../../middleware/validate";
import { refreshTokenController } from "./authController";
import methodNotAllowed from "../../utils/methodNotFound"
import auth from "../../middleware/auth";
import {
  forgotPasswordController,
  resetPasswordController,
  resendOtpController,
  changePasswordController,
  sessionStatusController
} from "./authController";
import {
  forgotPasswordValidation,
  resetPasswordValidation,
  requestResetValidation,
  changePasswordValidation
  
} from "./authValidation";
const router = Router();

router
  .route("/refresh")
  .post(refreshTokenController)
  .all(methodNotAllowed)



router
  .route("/forgot-password")
  .post(validate(forgotPasswordValidation, "body"), forgotPasswordController)
  .all(methodNotAllowed);

router
  .route("/resend-otp")
  .post(validate(forgotPasswordValidation, "body"), resendOtpController)
  .all(methodNotAllowed);

// Reset password with OTP
router
  .route("/reset-password")
  .post(validate(resetPasswordValidation, "body"), resetPasswordController)
  .all(methodNotAllowed);

router.get("/session-status",auth, sessionStatusController);
router
  .route("/change-password")
  .post(
    auth,                                     
    validate(changePasswordValidation, "body"),
    changePasswordController
  )
  .all(methodNotAllowed);


export default router;

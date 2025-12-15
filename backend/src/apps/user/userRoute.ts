// src/apps/user/userRoute.ts

import { Router } from 'express';
import { signupController, loginController,logoutController,getProfileController,updateProfileController } from './userController';
import { signupValidation, loginValidation,updateProfileValidation } from './userValidation';
import validate from '../../middleware/validate';
import auth from '../../middleware/auth'
import { IUserSignup, IUserLogin } from '../../utils/typeAliases';
import  methodNotAllowed  from "../../utils/methodNotFound"
import { decryptRequestBody } from "../../middleware/decryptRequestBody";
import upload from "../../middleware/upload";
const router = Router();

router
  .route('/signup')
  .post(validate<IUserSignup>(signupValidation), signupController)
  .all(methodNotAllowed);

router
  .route('/login')
  .post(validate<IUserLogin>(loginValidation), loginController)
  .all(methodNotAllowed);

router
  .route("/profile")
  .get(auth, getProfileController)
  .all(methodNotAllowed);

router
  .route("/update")
  .patch(
     auth,
    upload.single("avatar"),             // 1) multer runs first -> populates req.body (fields) & req.file
    decryptRequestBody,                  // 2) decrypts req.body.data -> replaces req.body with parsed object
    validate(updateProfileValidation, "body"),
    updateProfileController
  )
  .all(methodNotAllowed);

router.post("/logout", auth, logoutController, methodNotAllowed);
export default router;

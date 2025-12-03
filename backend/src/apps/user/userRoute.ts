// src/apps/user/userRoute.ts

import { Router } from 'express';
import { signupController, loginController,logoutController,getProfileController } from './userController';
import { signupValidation, loginValidation } from './userValidation';
import validate from '../../middleware/validate';
import auth from '../../middleware/auth'
import { IUserSignup, IUserLogin } from '../../utils/typeAliases';
import  methodNotAllowed  from "../../utils/methodNotFound"
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

router.post("/logout", auth, logoutController, methodNotAllowed);
export default router;

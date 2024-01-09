const express = require("express");
const {
  signUpSchema,
  updateSchema,
  loginSchema,
  updatePasswordSchema,
  forgetPasswordSchema,
  updateNewPasswordSchema,
} = require("../validations/authentication.schema");
const {
  addUserController,
  loginController,
  accountViewController,
  updateController,
  forgetPassword,
  updatePasswordController,
  forgetPasswordContrller,
} = require("../controllers/user.controller");
const { validate } = require("../middlewares/validate.middleware");
const { isAuthorised } = require("../middlewares/authorisation.middleware");
const { otpVerificationController, setNewPasswordController } = require("../controllers/authentication.controller");
const userRouter = express.Router();

userRouter.post("/signup", validate(signUpSchema), addUserController);

userRouter.post("/login", validate(loginSchema), loginController);

userRouter.get("/user", isAuthorised, accountViewController);

userRouter.patch(
  "/user/:id",
  isAuthorised,
  validate(updateSchema),
  updateController
);
userRouter.patch(
  "/update",
  isAuthorised,
  validate(updateSchema),
  updateController
);

userRouter.put(
  "/u/update/password",
  isAuthorised,
  validate(updatePasswordSchema),
  updatePasswordController
);

userRouter.post(
  "/forget/password",
  validate(forgetPasswordSchema),
  forgetPasswordContrller
);

userRouter.patch(
  "/update/new/password/:id",
  validate(updateNewPasswordSchema),
  setNewPasswordController
);


userRouter.post("/otp/verify/:id", otpVerificationController);

module.exports = userRouter;

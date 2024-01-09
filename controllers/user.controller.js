const jwt = require("jsonwebtoken");
const { models } = require("../config/sequelize-config");
const config = require("../config/config");
const helper = require("../services/helper");
const { mailConfig, transporter } = require("../config/email-config");
const otpGenerator = require("otp-generator");

const addUserController = async (req, res, next) => {
  try {
    const searchUser = await models.users.findAll({
      attributes: ["email", "user_name"],
      where: { email: req.body.email, user_name: req.body.user_name },
    });
    if (searchUser.length == 0) {
      const usersCreate = await models.users.create({
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        user_name: req.body.user_name,
        user_password: req.body.user_password,
        phone_no: req.body.phone_no,
      });
      res.json({
        usersCreate,
      });
    } else {
      return next({
        status: 400,
        message: "user already exits, check the email and username",
      });
    }
  } catch (error) {
    return res.json({
      message: error.message,
    });
  }
};

const loginController = async (req, res, next) => {
  try {
    const searchUser = await models.users.findOne({
      where: {
        email: req.body.email,
      },
    });
    if (searchUser === null) {
      return next({
        status: 400,
        message: "invalid email and username",
      });
    } else {
      const passwordMatch = await helper.comparePassword(
        req.body.user_password,
        searchUser.user_password
      );

      if (passwordMatch) {
        const payload = {
          user_id: searchUser.user_id,
          email: searchUser.email,
          user_name: searchUser.user_name,
        };
        const gen_token = jwt.sign(payload, config.jwtSecret, {
          expiresIn: "1h",
        });
        const updateUser = await models.users.update(
          {
            token: gen_token,
          },
          {
            where: {
              user_id: searchUser.user_id,
            },
            returning: true,
          }
        );
        return res.json({
          gen_token,
        });
      }
      return res.status(403).json("Not valid");
    }
  } catch (error) {
    console.log("\n error...", error);
    return res.json(error);
  }
};

const accountViewController = async (req, res) => {
  try {
    const searchUser = await models.users.findOne({
      where: {
        user_id: req.decoded.user_id,
      },
      logging: true,
    });

    return res.json({
      searchUser,
    });
  } catch (error) {
    console.log("\n error...", error);
    return res.json(error);
  }
};

const updateController = async (req, res, next) => {
  try {
    const searchUser = await models.users.findOne({
      where: { user_id: req.decoded.user_id },
    });
    if (searchUser === null) {
      return next({
        status: 400,
        message: "user not found",
      });
    } else {
      const updateUser = await models.users.update(
        {
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          email: req.body.email,
          user_name: req.body.user_name,
          user_password: req.body.user_password,
          phone_no: req.body.phone_no,
        },
        {
          where: {
            user_id: req.decoded.user_id,
          },
          returning: true,
          individualHooks: true,
        }
      );

      res.json({
        updateUser,
      });
    }
  } catch (error) {
    return res.json({
      message: error.message,
    });
  }
};

const updatePasswordController = async (req, res, next) => {
  try {
    const searchUser = await models.users.findOne({
      where: { user_id: req.decoded.user_id },
    });

    if (searchUser === null) {
      return next({
        status: 400,
        message: "User not found",
      });
    } else {
      const passwordMatch = await helper.comparePassword(
        req.body.old_password,
        searchUser.user_password
      );

      if (passwordMatch) {
        const updatedPassword = await models.users.update(
          {
            user_password: req.body.new_password,
          },
          {
            where: { user_id: req.decoded.user_id },
            returning: true,
            individualHooks: true,
          }
        );
        res.json({
          message: "Password Updated Successfully",
        });
      } else {
        return next({
          status: 400,
          message: "Password Incorrect",
        });
      }
    }
  } catch (error) {
    return next({
      status: 400,
      message: error.message,
    });
  }
};
const forgetPassword = async (req, res, next) => {
  try {
    const searchUser = await models.users.findOne({
      attributes: ["user_id"],
      where: { email: req.body.email },
    });

    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    if (searchUser === null) {
      return next({
        status: 400,
        message: "User not found",
      });
    } else {
      const OtpEntry = await models.verificationtable.create({
        verification_type: "forget",
        otp: otp,
        expiresAt: new Date().getTime() + 5 * 60000,
        user_id: searchUser.user_id,
      });
      const options = {
  from: `sender<${mailConfig.email}>`,
  to: req.body.email,
  subject: "Forget Password",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; text-align: center;">Forget Password</h2>
      <p style="color: #666; text-align: center;">Use the following OTP to reset your password:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center;">
        <p style="font-size: 24px; color: #333; margin: 0;">OTP: ${otp}</p>
      </div>
      <p style="color: #666; text-align: center;">This OTP is valid for 5 minutes.</p>
      <p style="color: #666; text-align: center;">If you didn't request a password reset, please ignore this email.</p>
    </div>
  `,
};


      transporter.sendMail(options, (error, info) => {
        if (error) console.log("\n mail error..", error);
        return console.log("\n success...", info);
      });

      return res.json("sending mail");
    }
  } catch (error) {
    return next({
      status: 400,
      message: error.message,
    });
  }
};


const forgetPasswordContrller = async (req, res, next) => {
  console.log(req.body.email);
  try {
    const searchUser = await models.users.findOne({
      attributes: ["user_id"],
      where: { email: req.body.email },
    });

    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    if (searchUser === null) {
      return next({
        status: 400,
        message: "User not found",
      });
    } else {
      const OtpEntry = await models.verificationtable.create({
        verification_type: "forget",
        otp: otp,
        expiresAt: new Date().getTime() + 5 * 60000,
        user_id: searchUser.user_id,
      });
      if (OtpEntry) {
        const options = {
          from: `Ram<${mailConfig.email}>`,
          to: req.body.email,
          subject: "forget password",
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">Forget Password</h2>
            <p style="color: #666; text-align: center;">Use the following OTP to reset your password:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center;">
              <p style="font-size: 24px; color: #333; margin: 0;">OTP: ${otp}</p>
            </div>
            <p style="color: #666; text-align: center;">This OTP is valid for 5 minutes.</p>
            <p style="color: #666; text-align: center;">If you didn't request a password reset, please ignore this email.</p>
          </div>
        `,
        };

        transporter.sendMail(options, (error, info) => {
          if (error) console.log("\n mail error..", error);
          return console.log("\n success...", info);
        });

        return res.json(searchUser);
      } else {
        return next({
          status: 400,
          message: "Otp not created",
        });
      }
    }
  } catch (error) {
    return next({
      status: 400,
      message: error.message,
    });
  }
};

module.exports = {
  addUserController,
  loginController,
  accountViewController,
  updateController,
  updatePasswordController,
  forgetPassword,
  forgetPasswordContrller  
};

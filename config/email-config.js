const nodemailer = require("nodemailer");
const mailConfig = {
  email: "ram_ram007@zohomail.com",
  password: "Medi@003",
};

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: mailConfig.email,
    pass: mailConfig.password,
  },
});

module.exports = { transporter, mailConfig };

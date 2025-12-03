// src/services/mailService.ts
import nodemailer from "nodemailer";
import Handlebars from "handlebars";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

interface SendOtpParams {
  to: string;
  name: string;
  otp: string;
}

export const sendOtpEmail = async ({
  to,
  name,
  otp
}: SendOtpParams) => {
  const source = `
    <div style="font-family: Arial, sans-serif; font-size: 14px;">
      <p>Hi {{name}},</p>
      <p>You requested to reset your password. Use the OTP below:</p>
      <h2 style="letter-spacing: 4px;">{{otp}}</h2>
      <p>This OTP is valid for 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
      <br />
      <p>Thanks,<br/>e-commerce team</p>
    </div>
  `;

  const template = Handlebars.compile(source);
  const html = template({ name, otp });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Password Reset OTP",
    html
  });
};


// // src/services/emailService.ts
// import sgMail, { MailDataRequired } from "@sendgrid/mail";
// import Handlebars from "handlebars";

// const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
// const SENDGRID_FROM = process.env.SENDGRID_FROM || "no-reply@example.com";

// if (!SENDGRID_API_KEY) {
//   console.warn(
//     "[SendGrid] SENDGRID_API_KEY is not set. Emails will fail until this is configured."
//   );
// } else {
//   sgMail.setApiKey(SENDGRID_API_KEY);
// }

// interface SendOtpParams {
//   to: string;
//   name: string;
//   otp: string;
// }

// /**
//  * Generic helper to send an email via SendGrid
//  */
// export const sendEmail = async (data: MailDataRequired) => {
//   if (!SENDGRID_API_KEY) {
//     throw new Error("SENDGRID_API_KEY not configured");
//   }

 
//   try {
//     await sgMail.send(data);
//   } catch (err: any) {
//     console.error("[SendGrid] sendEmail error:", JSON.stringify(err.response?.body, null, 2));
//     throw err;
//   }
// };

// /**
//  * Send Password Reset OTP Email
//  */
// export const sendPasswordResetOtpEmail = async ({
//   to,
//   name,
//   otp
// }: SendOtpParams) => {
//   // Simple Handlebars HTML template
//   const templateSource = `
//     <div style="font-family: Arial, sans-serif; font-size: 14px;">
//       <p>Hi {{name}},</p>
//       <p>You requested to reset your password. Use the OTP below:</p>
//       <h2 style="letter-spacing: 4px; font-size: 24px;">{{otp}}</h2>
//       <p>This OTP is valid for 10 minutes.</p>
//       <p>If you did not request this, you can safely ignore this email.</p>
//       <br />
//       <p>Thanks,<br/>Your App Team</p>
//     </div>
//   `;
//  const safeName = name || to.split("@")[0];
  
//   const template = Handlebars.compile(templateSource);
//   const html = template({ name: safeName, otp });

//   const msg: MailDataRequired = {
//     to,
//     from: SENDGRID_FROM,
//     subject: "Your Password Reset OTP",
//     html
//   };

//   await sendEmail(msg);
// };


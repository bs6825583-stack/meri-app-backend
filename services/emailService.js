const nodemailer = require("nodemailer");

const isEmailConfigured = Boolean(
  process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS
);

let transporter = null;
if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465, // true for 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log("✅ Email (Nodemailer) configured");
} else {
  console.log(
    "ℹ️  Email not configured — password reset tokens will be logged to console"
  );
}

/**
 * Sends an email. If email isn't configured, logs the content to the console
 * so the developer can still test the reset flow locally.
 */
async function sendEmail({ to, subject, html, text }) {
  if (!isEmailConfigured) {
    console.log("\n========== EMAIL (console fallback) ==========");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Text:", text || html);
    console.log("==============================================\n");
    return { fallback: true };
  }

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  });
}

module.exports = { sendEmail, isEmailConfigured };

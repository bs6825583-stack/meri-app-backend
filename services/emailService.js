const { Resend } = require("resend");

const isEmailConfigured = Boolean(process.env.RESEND_API_KEY);

let resend = null;
if (isEmailConfigured) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log("✅ Email (Resend) configured");
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

  const { data, error } = await resend.emails.send({
    // Resend's free/testing sender — works without verifying your own domain
    from: process.env.EMAIL_FROM || "TripInsider <onboarding@resend.dev>",
    to,
    subject,
    text,
    html,
  });

  if (error) {
    console.error("❌ Resend error:", error);
    throw new Error(error.message || "Email could not be sent");
  }

  return data;
}

module.exports = { sendEmail, isEmailConfigured };
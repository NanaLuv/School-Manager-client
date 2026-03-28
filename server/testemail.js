// test-email.js
require("dotenv").config();
const nodemailer = require("nodemailer");

async function testGmail() {
  console.log("🔧 Testing with:");
  console.log("   USER:", process.env.EMAIL_USER);
  // Log the password length and first/last char to check for spaces or truncation
  const pass = process.env.EMAIL_PASS || "";
  console.log("   PASS length:", pass.length);
  console.log("   PASS starts with:", pass.substring(0, 4));
  console.log("   PASS ends with:", pass.substring(pass.length - 4));

  // Check if password contains spaces (it shouldn't!)
  if (pass.includes(" ")) {
    console.log("❌ ERROR: Password contains spaces! Remove them.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: pass,
    },
    // Add a debug logger
    logger: true,
    debug: true,
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER,
      subject: "Test Email",
      text: "If you get this, Gmail works!",
    });

    console.log("✅ Success! Email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Failed:", error.message);
    console.error("Full error:", error);
  }
}

testGmail();

// test-arkesel.js
require("dotenv").config();
const arkesel = require("./utils/arkeselSmsService");

async function testSMS() {
  console.log("Testing Arkesel simple send...");

  // Test with your number
  const result = await arkesel.sendSMS(
    "0241585920",
    "Test from School System - Your child's payment receipt is ready.",
  );

  if (result.success) {
    console.log("✅ SMS sent!");
    console.log("Message ID:", result.messageId);
  } else {
    console.log("❌ Failed:", result.error);
  }

  // Check balance
  const balance = await arkesel.getBalance();
  console.log("Balance:", balance);
}

testSMS();

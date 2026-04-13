require("dotenv").config();
const arkesel = require("./utils/arkeselSmsService");

async function testSMS() {
  console.log("\n🔍 Testing Arkesel SMS...\n");

  // Test 1: Check balance
  console.log("1️⃣ Checking balance...");
  const balance = await arkesel.getBalance();
  console.log("   Balance:", balance);

  // Test 2: Send test SMS with default sender
  console.log("\n2️⃣ Sending test SMS...");
  const result = await arkesel.sendSMS(
    "0241585920",
    "Test from School System - This is a test message.",
  );

  if (result.success) {
    console.log("✅ SMS sent!");
    console.log("   Message ID:", result.messageId);
  } else {
    console.log("❌ Failed:", result.error);
  }
}

testSMS();

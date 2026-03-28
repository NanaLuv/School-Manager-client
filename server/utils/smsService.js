// utils/smsService.js
const arkesel = require("./arkeselSmsService");
const pool = require("../db");

// Function to get school settings
const getSchoolSettingsForEmail = async () => {
  try {
    const [settings] = await pool.query(`
      SELECT * FROM school_settings 
      ORDER BY id DESC 
      LIMIT 1
    `);

    if (settings.length === 0) {
      return {
        school_name: "School Manager Academy",
        school_short_name: "SMA",
        motto: "Quality Education for All",
        address: "123 Education Street",
        phone_numbers: ["(233) 123-4567"],
        email: "info@school.edu",
        website: "",
        currency_symbol: "Ghc",
        logo_filename: null,
      };
    }

    const setting = settings[0];

    let phoneNumbers = ["(233) 123-4567"];
    if (setting.phone_numbers) {
      try {
        phoneNumbers =
          typeof setting.phone_numbers === "string"
            ? JSON.parse(setting.phone_numbers)
            : setting.phone_numbers;
      } catch (e) {
        phoneNumbers = [setting.phone_numbers];
      }
    }

    return {
      school_name: setting.school_name || "School Manager Academy",
      school_short_name: setting.school_short_name || "SMA",
      motto: setting.motto || "",
      address: setting.address || "",
      city: setting.city || "",
      region: setting.region || "",
      phone_numbers: phoneNumbers,
      email: setting.email || "",
      website: setting.website || "",
      currency_symbol: setting.currency_symbol || "Ghc",
      logo_filename: setting.logo_filename,
      bank_name: setting.bank_name,
      account_number: setting.account_number,
      account_name: setting.account_name,
    };
  } catch (error) {
    console.error("Error fetching school settings:", error);
    return {
      school_name: "School Manager Academy",
      school_short_name: "SMA",
      currency_symbol: "Ghc",
    };
  }
};

// SMS Templates - gets schoolSettings internally
const getSMSTemplates = async () => {
  const schoolSettings = await getSchoolSettingsForEmail();
  const schoolName =
    schoolSettings.school_short_name || schoolSettings.school_name || "REMALJ";

  return {
    paymentReceipt: (student, payment, receiptNumber) => {
      return `${schoolName}: Payment received for ${student.first_name} ${student.last_name}. Amount: Ghc ${payment.amount_paid.toFixed(2)}. Receipt: ${receiptNumber}. Thank you!`;
    },

    balanceReminder: (student, balance) => {
      const amount = parseFloat(balance.remaining_balance).toFixed(2);
      return `${schoolName}: Reminder: ${student.first_name} ${student.last_name} has outstanding fees of Ghc ${amount}. Please pay by ${balance.due_date || "end of term"}. Contact finance office.`;
    },

    shortBalanceReminder: (student, balance) => {
      const amount = parseFloat(balance.remaining_balance).toFixed(2);
      return `${schoolName}: Fee balance of Ghc ${amount} due for ${student.first_name} ${student.last_name}. Please pay soon.`;
    },
  };
};

// Send SMS with logging - FIXED SQL
const sendSMS = async (studentId, phoneNumber, message, type = "general") => {
  try {
    if (!phoneNumber) {
      return { success: false, error: "No phone number provided" };
    }

    // Send via Arkesel
    const result = await arkesel.sendSMS(phoneNumber, message);

    // Log to database
    await pool.query(
      `INSERT INTO sms_logs 
       (student_id, phone_number, message, type, status, message_id, error_message, sent_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        studentId,
        phoneNumber,
        message.substring(0, 500),
        type,
        result.success ? "sent" : "failed",
        result.messageId || null,
        result.error || null,
      ],
    );

    return result;
  } catch (error) {
    console.error("SMS service error:", error);

    // Log failure - FIXED SQL
    try {
      await pool.query(
        `INSERT INTO sms_logs 
         (student_id, phone_number, message, type, status, error_message, sent_at) 
         VALUES (?, ?, ?, ?, 'failed', ?, NOW())`,
        [
          studentId,
          phoneNumber,
          message.substring(0, 500),
          type,
          error.message || "Unknown error",
        ],
      );
    } catch (logError) {
      console.error("Failed to log SMS error:", logError);
    }

    return { success: false, error: error.message };
  }
};

// Send payment receipt SMS
const sendPaymentReceiptSMS = async (student, payment, receiptNumber) => {
  const templates = await getSMSTemplates();
  const message = templates.paymentReceipt(student, payment, receiptNumber);

  return await sendSMS(
    student.id,
    student.parent_contact,
    message,
    "payment_receipt",
  );
};

// Send balance reminder SMS
const sendBalanceReminderSMS = async (student, balance) => {
  const templates = await getSMSTemplates();
  let message = templates.balanceReminder(student, balance);

  if (message.length > 160) {
    message = templates.shortBalanceReminder(student, balance);
  }

  return await sendSMS(
    student.id,
    student.parent_contact,
    message,
    "balance_reminder",
  );
};

module.exports = {
  sendSMS,
  sendPaymentReceiptSMS,
  sendBalanceReminderSMS,
  getSchoolSettingsForEmail,
};

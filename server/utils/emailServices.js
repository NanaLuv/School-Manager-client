const nodemailer = require("nodemailer");
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

    // Parse phone numbers if it's JSON
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
    console.error("Error fetching school settings for email:", error);
    // Return defaults on error
    return {
      school_name: "School Manager Academy",
      school_short_name: "SMA",
      currency_symbol: "Ghc",
    };
  }
};

const createTransporter = () => {
  // Check if we're in development mode
  // if (process.env.NODE_ENV === "development" && !process.env.EMAIL_USER) {
  //   // Use Ethereal for development (fake emails)
  //   return nodemailer.createTransport({
  //     host: "smtp.ethereal.email",
  //     port: 587,
  //     secure: false,
  //     auth: {
  //       user: process.env.ETHEREAL_USER,
  //       pass: process.env.ETHEREAL_PASS
  //     },
  //   });
  // }

  // Use Gmail for production
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Send payment receipt email
// const sendPaymentReceipt = async (paymentData, studentData, receiptNumber) => {
//   try {
//     const schoolSettings = await getSchoolSettingsForEmail();
//     const transporter = createTransporter();

//     const parentEmail = studentData.parent_email || studentData.student_email;
//     const parentPhone = studentData.parent_contact;

//     if (!parentEmail) {
//       return { success: false, message: "No email address available" };
//     }

//     const mailOptions = {
//       from: `"${schoolSettings.school_name}" <${process.env.EMAIL_FROM || "noreply@school.edu"}>`,
//       to: parentEmail,
//       subject: `Payment Receipt - ${receiptNumber}`,
//       html: generatePaymentEmailHTML(
//         paymentData,
//         studentData,
//         receiptNumber,
//         schoolSettings,
//       ),
//     };

//     const info = await transporter.sendMail(mailOptions);
//     console.log("Email sent:", info.messageId);


//     return {
//       success: true,
//       messageId: info.messageId,
//       previewUrl,
//     };
//   } catch (error) {
//     console.error("Error sending email:", error);
//     return { success: false, error: error.message };
//   }
// };

const sendPaymentReceipt = async (paymentData, studentData, receiptNumber) => {
  try {
    const schoolSettings = await getSchoolSettingsForEmail();
    const transporter = createTransporter();

    const parentEmail = studentData.parent_email || studentData.student_email;
    const parentPhone = studentData.parent_contact; // Phone number for SMS

    let emailResult = null;
    let smsResult = null;

    // Send email if email exists
    if (parentEmail) {
      const mailOptions = {
        from: `"${schoolSettings.school_name}" <${process.env.EMAIL_FROM || "noreply@school.edu"}>`,
        to: parentEmail,
        subject: `Payment Receipt - ${receiptNumber}`,
        html: generatePaymentEmailHTML(
          paymentData,
          studentData,
          receiptNumber,
          schoolSettings,
        ),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.messageId);

      emailResult = { success: true, messageId: info.messageId };
    } else {
      console.log("No email found for parent/student");
    }

    // Send SMS if phone exists
    if (parentPhone) {
      try {
        const { sendPaymentReceiptSMS } = require("./smsService");
        const smsResponse = await sendPaymentReceiptSMS(
          studentData,
          paymentData,
          receiptNumber,
          schoolSettings,
        );

        if (smsResponse.success) {
          console.log(`SMS sent to ${parentPhone}`);
          smsResult = { success: true, messageId: smsResponse.messageId };
        } else {
          console.log(`SMS failed: ${smsResponse.error}`);
          smsResult = { success: false, error: smsResponse.error };
        }
      } catch (smsError) {
        console.error("Error sending SMS:", smsError);
        smsResult = { success: false, error: smsError.message };
      }
    } else {
      console.log("No phone found for parent/student");
    }

    // // For Ethereal - get preview URL
    // let previewUrl = null;
    // if (nodemailer.getTestMessageUrl && emailResult) {
    //   previewUrl = nodemailer.getTestMessageUrl(info);
    // }

    return {
      success: true,
      messageId: emailResult?.messageId,
      email: emailResult,
      sms: smsResult,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
};

// Generate HTML email (same as before)
const generatePaymentEmailHTML = (
  payment,
  student,
  receiptNumber,
  schoolSettings,
) => {
  const paymentDate = new Date(payment.payment_date).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );
  let phoneDisplay = "";
  if (schoolSettings.phone_numbers && schoolSettings.phone_numbers.length > 0) {
    phoneDisplay = schoolSettings.phone_numbers.join(" • ");
  }

  // Build address string
  const addressParts = [];
  if (schoolSettings.address) addressParts.push(schoolSettings.address);
  if (schoolSettings.city) addressParts.push(schoolSettings.city);
  if (schoolSettings.region) addressParts.push(schoolSettings.region);
  const fullAddress = addressParts.join(", ");

  const currency = schoolSettings.currency_symbol || "Ghc";

  return `
    <!DOCTYPE html>
    <html>
    <head>
    <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0;
      padding: 0;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px; 
      border: 1px solid #ddd; 
      border-radius: 8px; 
    }
    .header { 
      background: #4f46e5; 
      color: white; 
      padding: 20px; 
      text-align: center; 
      border-radius: 8px 8px 0 0; 
      margin: -20px -20px 20px -20px; 
    }
    .school-name {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .school-motto {
      font-size: 14px;
      font-style: italic;
      opacity: 0.9;
    }
    .receipt-box { 
      background: #f9fafb; 
      padding: 20px; 
      border-radius: 8px; 
      margin: 20px 0; 
    }
    .amount { 
      font-size: 28px; 
      font-weight: bold; 
      color: #059669; 
      text-align: center;
      margin: 15px 0;
    }
    .details { 
      margin: 20px 0; 
    }
    .detail-row { 
      display: flex; 
      justify-content: space-between; 
      padding: 8px 0; 
      border-bottom: 1px solid #eee; 
    }
    .label { 
      font-weight: 600; 
      color: #6b7280; 
    }
    .school-footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
    .contact-info {
      margin-top: 5px;
      font-size: 11px;
    }
    .button { 
      background: #4f46e5; 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 6px; 
      display: inline-block; 
      margin: 20px 0; 
    }
  </style>
    </head>
    <body>
    <div class="container">
      <div class="header">
      <img src="${process.env.SERVER_URL}/uploads/school-logo/${schoolSettings.logo_filename}" alt="School Logo" style="max-height: 60px; margin-bottom: 10px;">
        <div class="school-name">${schoolSettings.school_name}</div>
        ${schoolSettings.motto ? `<div class="school-motto">${schoolSettings.motto}</div>` : ""}
      </div>
      
      <h2 style="text-align: center; color: #374151;">Payment Receipt</h2>
      
      <p>Dear ${student.parent_name || "Parent/Guardian"},</p>
      
      <p>We've received a payment for <strong>${student.first_name} ${student.last_name}</strong>. Thank you for your prompt payment!</p>
      
      <div class="receipt-box">
        <h3 style="margin-top: 0; color: #374151; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
          Receipt: ${receiptNumber}
        </h3>
        
        <div class="amount">${currency} ${parseFloat(payment.amount_paid).toFixed(2)}</div>
        
        <div class="details">
          <div class="detail-row">
            <span class="label">Student:</span>
            <span>${student.first_name} ${student.last_name}</span>
          </div>
          <div class="detail-row">
            <span class="label">Admission No:</span>
            <span>${student.admission_number}</span>
          </div>
          ${
            student.class_name
              ? `
          <div class="detail-row">
            <span class="label">Class:</span>
            <span>${student.class_name}</span>
          </div>`
              : ""
          }
          <div class="detail-row">
            <span class="label">Payment Date:</span>
            <span>${paymentDate}</span>
          </div>
          <div class="detail-row">
            <span class="label">Payment Method:</span>
            <span>${payment.payment_method}</span>
          </div>
          ${
            payment.reference_number
              ? `
          <div class="detail-row">
            <span class="label">Reference:</span>
            <span>${payment.reference_number}</span>
          </div>`
              : ""
          }
        </div>
      </div>
      
      

      <p>If you have any questions about this receipt or your account, please contact the finance office.</p>
      
      <div class="school-footer">
        <div><strong>${schoolSettings.school_name}</strong></div>
        ${fullAddress ? `<div>${fullAddress}</div>` : ""}
        ${phoneDisplay ? `<div class="contact-info">📞 ${phoneDisplay}</div>` : ""}
        ${schoolSettings.email ? `<div class="contact-info">✉️ ${schoolSettings.email}</div>` : ""}
        ${schoolSettings.website ? `<div class="contact-info">🌐 ${schoolSettings.website}</div>` : ""}
        
        ${
          schoolSettings.bank_name
            ? `
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ddd;">
          <div><strong>Bank Details:</strong> ${schoolSettings.bank_name}</div>
          ${schoolSettings.account_name ? `<div>Account Name: ${schoolSettings.account_name}</div>` : ""}
          ${schoolSettings.account_number ? `<div>Account Number: ${schoolSettings.account_number}</div>` : ""}
        </div>`
            : ""
        }
        
        <div style="margin-top: 15px; font-size: 10px;">
          This is an automated message from the School Management System.<br>
          &copy; ${new Date().getFullYear()} ${schoolSettings.school_name}. All rights reserved.
        </div>
      </div>
    </div>
  </body>
    </html>
  `;
};

//reminder balance email
const sendBalanceReminder = async (
  studentData,
  balanceData,
  schoolSettings,
) => {
  try {
    const transporter = await createTransporter();

    let parentEmail = studentData.parent_email || studentData.student_email;

    if (!parentEmail) {
      return {
        success: false,
        message: "No email address available",
        debug: {
          parent_email: studentData.parent_email,
          student_email: studentData.student_email,
          parent_contact: studentData.parent_contact,
        },
      };
    }

    const mailOptions = {
      from: `"${schoolSettings.school_name}" <${process.env.EMAIL_USER}>`,
      to: parentEmail,
      subject: `Fee Balance Reminder - ${studentData.first_name} ${studentData.last_name}`,
      html: generateBalanceReminderHTML(
        studentData,
        balanceData,
        schoolSettings,
      ),
    };

    const info = await transporter.sendMail(mailOptions);
    let previewUrl = null;
    if (nodemailer.getTestMessageUrl) {
      previewUrl = nodemailer.getTestMessageUrl(info);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (error) {
    console.error("Error sending reminder email:", error);
    return { success: false, error: error.message };
  }
};

// Generate balance reminder HTML
const generateBalanceReminderHTML = (student, balance, schoolSettings) => {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7); // 7 days from now

  const formattedDueDate = dueDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const currency = schoolSettings.currency_symbol || "Ghc";
  const balanceAmount = parseFloat(balance.remaining_balance || 0);

  // Format phone numbers
  let phoneDisplay = "";
  if (schoolSettings.phone_numbers && schoolSettings.phone_numbers.length > 0) {
    phoneDisplay = schoolSettings.phone_numbers.join(" • ");
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
          border: 1px solid #ddd; 
          border-radius: 8px; 
        }
        .header { 
          background: #dc2626; 
          color: white; 
          padding: 20px; 
          text-align: center; 
          border-radius: 8px 8px 0 0; 
          margin: -20px -20px 20px -20px; 
        }
        .school-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .reminder-badge {
          background: #fee2e2;
          color: #dc2626;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          display: inline-block;
          margin: 10px 0;
        }
        .balance-box { 
          background: #fef2f2; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0; 
          border-left: 4px solid #dc2626;
        }
        .amount-due { 
          font-size: 32px; 
          font-weight: bold; 
          color: #dc2626; 
          text-align: center;
          margin: 15px 0;
        }
        .details { 
          margin: 20px 0; 
        }
        .detail-row { 
          display: flex; 
          justify-content: space-between; 
          padding: 8px 0; 
          border-bottom: 1px solid #eee; 
        }
        .label { 
          font-weight: 600; 
          color: #6b7280; 
        }
        .button {
          background: #dc2626;
          color: white;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 6px;
          display: inline-block;
          margin: 20px 0;
          font-weight: bold;
        }
        .button:hover {
          background: #b91c1c;
        }
        .payment-options {
          background: #f9fafb;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="school-name">${schoolSettings.school_name}</div>
          ${schoolSettings.motto ? `<div>${schoolSettings.motto}</div>` : ""}
        </div>
        
        <div style="text-align: center;">
          <div class="reminder-badge">🔔 PAYMENT REMINDER</div>
        </div>
        
        <p>Dear ${student.parent_name || "Parent/Guardian"},</p>
        
        <p>This is a friendly reminder that there's an outstanding balance for <strong>${student.first_name} ${student.last_name}</strong>. Please arrange payment at your earliest convenience.</p>
        
        <div class="balance-box">
          <div style="text-align: center; margin-bottom: 10px;">
            <span style="color: #6b7280;">Current Outstanding Balance</span>
          </div>
          <div class="amount-due">${currency} ${balanceAmount.toFixed(2)}</div>
          
          <div class="details">
            <div class="detail-row">
              <span class="label">Student:</span>
              <span>${student.first_name} ${student.last_name}</span>
            </div>
            <div class="detail-row">
              <span class="label">Admission No:</span>
              <span>${student.admission_number}</span>
            </div>
            ${
              student.class_name
                ? `
            <div class="detail-row">
              <span class="label">Class:</span>
              <span>${student.class_name}</span>
            </div>`
                : ""
            }
            <div class="detail-row">
              <span class="label">Academic Year:</span>
              <span>${balance.academic_year || "Current"}</span>
            </div>
            <div class="detail-row">
              <span class="label">Term:</span>
              <span>${balance.term_name || "Current"}</span>
            </div>
            <div class="detail-row">
              <span class="label">Total Billed:</span>
              <span>${currency} ${parseFloat(balance.total_amount || 0).toFixed(2)}</span>
            </div>
            <div class="detail-row">
              <span class="label">Amount Paid:</span>
              <span class="text-green-600">${currency} ${parseFloat(balance.paid_amount || 0).toFixed(2)}</span>
            </div>
            <div class="detail-row" style="border-bottom: none;">
              <span class="label">Due Date:</span>
              <span style="color: #dc2626; font-weight: bold;">${formattedDueDate}</span>
            </div>
          </div>
        </div>
        
        <div class="payment-options">
          <h4 style="margin-top: 0; color: #374151;">Payment Options</h4>
          
          ${
            schoolSettings.bank_name
              ? `
          <p><strong>Bank Transfer:</strong> ${schoolSettings.bank_name}</p>
          ${schoolSettings.account_name ? `<p>Account Name: ${schoolSettings.account_name}</p>` : ""}
          ${schoolSettings.account_number ? `<p>Account Number: ${schoolSettings.account_number}</p>` : ""}
          `
              : ""
          }
          
          ${
            schoolSettings.mobile_money_provider
              ? `
          <p><strong>Mobile Money:</strong> ${schoolSettings.mobile_money_provider} - ${schoolSettings.mobile_money_number}</p>
          `
              : ""
          }
          
          <p><strong>In Person:</strong> Visit the school finance office during working hours.</p>
        </div>
        
        <div style="text-align: center;">
          <a href="#" class="button">Make a Payment Now</a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280;">
          If you've already made this payment, please ignore this reminder. Payments may take 1-2 business days to reflect in our system.
        </p>
        
        <div class="footer">
          <div><strong>${schoolSettings.school_name}</strong></div>
          ${schoolSettings.address ? `<div>${schoolSettings.address}</div>` : ""}
          ${phoneDisplay ? `<div>📞 ${phoneDisplay}</div>` : ""}
          ${schoolSettings.email ? `<div>✉️ ${schoolSettings.email}</div>` : ""}
          <div style="margin-top: 10px; font-size: 10px;">
            This is an automated reminder from the School Management System.<br>
            &copy; ${new Date().getFullYear()} ${schoolSettings.school_name}. All rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  sendPaymentReceipt,
  sendBalanceReminder,
};

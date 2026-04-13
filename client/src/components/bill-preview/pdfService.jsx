import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";


export const generateBillPDF = async (previewData, element = null) => {
  try {
    // First, fetch school settings
    let schoolSettings = null;
    try {
      const response = await axios.get(
        "http://localhost:3001/schmgt/school-settings"
      );
      schoolSettings = response.data;

      // Parse phone numbers if it's a JSON string
      if (
        schoolSettings.phone_numbers &&
        typeof schoolSettings.phone_numbers === "string"
      ) {
        try {
          schoolSettings.phone_numbers = JSON.parse(
            schoolSettings.phone_numbers
          );
        } catch (e) {
          schoolSettings.phone_numbers = [schoolSettings.phone_numbers];
        }
      }
    } catch (error) {
      console.warn("Could not fetch school settings, using defaults:", error);
      schoolSettings = {
        school_name: "School Manager Academy",
        address: "123 Education Street, Learning City",
        phone_numbers: ["(233) 123-4567"],
        email: "info@sma.edu.gh",
        motto: "Quality Education for All",
        logo_filename: null,
      };
    }

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    let yPosition = 30;

    // ==================== HEADER WITH SCHOOL LOGO ====================
    // Colors
    const primaryColor = [41, 128, 185];

    // Try to add logo if it exists
    let hasLogo = false;
    if (schoolSettings.logo_filename) {
      try {
        const logoUrl = `http://localhost:3001/uploads/school-logo/${schoolSettings.logo_filename}`;

        // Create image element
        const img = new Image();
        img.crossOrigin = "anonymous";

        // Convert image to base64
        const imgBase64 = await new Promise((resolve, reject) => {
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          };
          img.onerror = reject;
          img.src = logoUrl;
        });

        // Add logo to PDF (20x20mm)
        pdf.addImage(imgBase64, "PNG", 15, 10, 20, 20);
        hasLogo = true;
      } catch (logoError) {
        console.warn("Could not load logo:", logoError);
        hasLogo = false;
      }
    }

    // School information position (adjust based on logo)
    const schoolNameX = hasLogo ? 40 : 20;

    // School name
    pdf.setFontSize(hasLogo ? 14 : 16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...primaryColor);
    pdf.text(schoolSettings.school_name, schoolNameX, 15);

    // School motto if exists
    if (schoolSettings.motto) {
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(100, 100, 100);
      pdf.text(schoolSettings.motto, schoolNameX, 20);
    }

    // School address
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);

    // Build address line
    let addressLine = schoolSettings.address || "";
    if (schoolSettings.city) addressLine += `, ${schoolSettings.city}`;
    if (schoolSettings.region) addressLine += `, ${schoolSettings.region}`;

    // Split address if too long
    const addressLines = pdf.splitTextToSize(
      addressLine,
      pageWidth - schoolNameX - 20
    );
    addressLines.forEach((line, index) => {
      pdf.text(line, schoolNameX, 25 + index * 4);
    });

    // Contact info
    let contactY = 25 + addressLines.length * 4 + 2;
    let contactInfo = "";

    if (
      schoolSettings.phone_numbers &&
      schoolSettings.phone_numbers.length > 0
    ) {
      const phones = Array.isArray(schoolSettings.phone_numbers)
        ? schoolSettings.phone_numbers
        : [schoolSettings.phone_numbers];

      contactInfo = `Phone: ${phones[0]}`;
      if (phones.length > 1) {
        contactInfo += ` / ${phones[1]}`;
      }
    }

    if (schoolSettings.email) {
      if (contactInfo) contactInfo += " • ";
      contactInfo += `Email: ${schoolSettings.email}`;
    }

    if (contactInfo) {
      pdf.text(contactInfo, schoolNameX, contactY);
      contactY += 4;
    }

    // Add a decorative line
    pdf.setDrawColor(...primaryColor);
    pdf.setLineWidth(0.5);
    pdf.line(15, contactY + 2, pageWidth - 15, contactY + 2);

    // Bill title
    yPosition = contactY + 10;
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...primaryColor);
    pdf.text("STUDENT FEE BILL", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    // ==================== STUDENT INFORMATION ====================
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);

    // Student details in two columns
    const leftColumnX = 20;
    const rightColumnX = pageWidth / 2 + 10;

    const studentInfoLeft = [
      ["Student Name:", previewData.student.name],
      ["Admission No:", previewData.student.admission_number],
      ["Class:", previewData.student.class_name],
    ];

    const studentInfoRight = [
      ["Bill Status:", previewData.isFinalized ? "FINALIZED" : "DRAFT"],
      ["Date:", new Date().toLocaleDateString()],
    ];

    // Draw left column
    studentInfoLeft.forEach(([label, value], index) => {
      pdf.text(label, leftColumnX, yPosition);
      pdf.text(value, leftColumnX + 40, yPosition);
      yPosition += 6;
    });

    // Reset yPosition for right column
    let rightColumnY = yPosition - studentInfoLeft.length * 6;

    // Draw right column
    studentInfoRight.forEach(([label, value]) => {
      pdf.text(label, rightColumnX, rightColumnY);
      pdf.text(value, rightColumnX + 35, rightColumnY);
      rightColumnY += 6;
    });

    // Use the lower of the two column positions to continue
    yPosition = Math.max(yPosition, rightColumnY) + 8;

    // ==================== COMPULSORY FEES SECTION ====================
    const compulsoryColor = [220, 53, 69];
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...compulsoryColor);
    pdf.text("COMPULSORY FEES", 20, yPosition);
    yPosition += 8;

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);

    // Table headers
    pdf.setFillColor(240, 240, 240);
    pdf.rect(20, yPosition, pageWidth - 40, 5, "F");
    pdf.text("Description", 25, yPosition + 3.5);
    pdf.text("Amount (Ghc)", pageWidth - 30, yPosition + 3.5, {
      align: "right",
    });
    yPosition += 9;

    // Compulsory bills
    previewData.compulsoryBills.forEach((bill, index) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
        // Re-add simple header for new page
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          `Continuation - ${schoolSettings.school_name}`,
          pageWidth / 2,
          10,
          { align: "center" }
        );
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        yPosition = 25;
      }

      const amount =
        previewData.isFinalized && bill.finalAmount
          ? bill.finalAmount
          : parseFloat(bill.amount);
      pdf.text(bill.category_name, 25, yPosition);
      pdf.text(amount.toFixed(2), pageWidth - 25, yPosition, {
        align: "right",
      });
      yPosition += 4;

      // Bill description
      if (bill.description) {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        const descLines = pdf.splitTextToSize(bill.description, pageWidth - 50);
        descLines.forEach((line, i) => {
          pdf.text(line, 30, yPosition + i * 3);
        });
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        yPosition += descLines.length * 3 + 2;
      } else {
        yPosition += 2;
      }
    });

    // Compulsory total
    yPosition += 5;
    pdf.setFont("helvetica", "bold");
    pdf.text("Compulsory Total:", pageWidth - 65, yPosition);
    pdf.text(
      previewData.totals.compulsory.toFixed(2),
      pageWidth - 25,
      yPosition,
      { align: "right" }
    );
    yPosition += 8;

    // ==================== OPTIONAL FEES SECTION ====================
    if (previewData.optionalBills.length > 0) {
      const optionalColor = [13, 110, 253];
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...optionalColor);
      pdf.text("OPTIONAL FEES", 20, yPosition);
      yPosition += 8;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);

      // Table headers
      pdf.setFillColor(240, 240, 240);
      pdf.rect(20, yPosition, pageWidth - 40, 5, "F");
      pdf.text("Description", 25, yPosition + 3.5);
      pdf.text("Amount (Ghc)", pageWidth - 30, yPosition + 3.5, {
        align: "right",
      });
      yPosition += 9;

      // Optional bills
      previewData.optionalBills.forEach((bill, index) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
          // Re-add simple header for new page
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          pdf.text(
            `Continuation - ${schoolSettings.school_name}`,
            pageWidth / 2,
            10,
            { align: "center" }
          );
          pdf.setFontSize(9);
          pdf.setTextColor(0, 0, 0);
          yPosition = 25;
        }

        const amount =
          previewData.isFinalized && bill.finalAmount
            ? bill.finalAmount
            : parseFloat(bill.amount);
        pdf.text(bill.category_name, 25, yPosition);
        pdf.text(amount.toFixed(2), pageWidth - 25, yPosition, {
          align: "right",
        });
        yPosition += 4;

        if (bill.description) {
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          const descLines = pdf.splitTextToSize(
            bill.description,
            pageWidth - 50
          );
          descLines.forEach((line, i) => {
            pdf.text(line, 30, yPosition + i * 3);
          });
          pdf.setFontSize(9);
          pdf.setTextColor(0, 0, 0);
          yPosition += descLines.length * 3 + 2;
        } else {
          yPosition += 2;
        }
      });

      // Optional total
      yPosition += 5;
      pdf.setFont("helvetica", "bold");
      pdf.text("Optional Total:", pageWidth - 60, yPosition);
      pdf.text(
        previewData.totals.optional.toFixed(2),
        pageWidth - 25,
        yPosition,
        { align: "right" }
      );
      yPosition += 8;
    }

    // ==================== ARREARS SECTION ====================
    if (previewData.arrears.length > 0) {
      const arrearsColor = [253, 126, 20];
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...arrearsColor);
      pdf.text("OUTSTANDING ARREARS", 20, yPosition);
      yPosition += 8;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);

      previewData.arrears.forEach((arrear, index) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
          // Re-add simple header for new page
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          pdf.text(
            `Continuation - ${schoolSettings.school_name}`,
            pageWidth / 2,
            10,
            { align: "center" }
          );
          pdf.setFontSize(9);
          pdf.setTextColor(0, 0, 0);
          yPosition = 25;
        }

        pdf.text(arrear.description, 25, yPosition);
        pdf.text(
          parseFloat(arrear.amount).toFixed(2),
          pageWidth - 25,
          yPosition,
          { align: "right" }
        );
        yPosition += 6;
      });

      yPosition += 5;
      pdf.setFont("helvetica", "bold");
      pdf.text("Total Arrears:", pageWidth - 60, yPosition);
      pdf.text(
        previewData.totals.arrearsTotal.toFixed(2),
        pageWidth - 25,
        yPosition,
        { align: "right" }
      );
      yPosition += 8;
    }

    // ==================== CREDITS SECTION ====================
    if (previewData.overpayments.length > 0) {
      const creditColor = [25, 135, 84];
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...creditColor);
      pdf.text("AVAILABLE CREDITS", 20, yPosition);
      yPosition += 8;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);

      previewData.overpayments.forEach((overpayment, index) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
          // Re-add simple header for new page
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          pdf.text(
            `Continuation - ${schoolSettings.school_name}`,
            pageWidth / 2,
            10,
            { align: "center" }
          );
          pdf.setFontSize(9);
          pdf.setTextColor(0, 0, 0);
          yPosition = 25;
        }

        pdf.text(overpayment.description, 25, yPosition);
        pdf.text(
          `-${parseFloat(overpayment.amount).toFixed(2)}`,
          pageWidth - 25,
          yPosition,
          { align: "right" }
        );
        yPosition += 6;
      });

      yPosition += 5;
      pdf.setFont("helvetica", "bold");
      pdf.text("Total Credits:", pageWidth - 60, yPosition);
      pdf.text(
        `-${previewData.totals.overpaymentsTotal.toFixed(2)}`,
        pageWidth - 25,
        yPosition,
        { align: "right" }
      );
      yPosition += 8;
    }

    // ==================== FINAL TOTAL ====================
    yPosition += 5;
    pdf.setFillColor(33, 37, 41);
    pdf.rect(20, yPosition, pageWidth - 40, 10, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");

    if (previewData.totals.total > 0) {
      pdf.text("TOTAL AMOUNT DUE:", 25, yPosition + 6);
      pdf.text(
        `Ghc ${previewData.totals.total.toFixed(2)}`,
        pageWidth - 25,
        yPosition + 6,
        { align: "right" }
      );
    } else {
      pdf.text("FULLY COVERED BY CREDITS", pageWidth / 2, yPosition + 6, {
        align: "center",
      });
    }

    yPosition += 20;

    // ==================== FOOTER ====================
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");

    // School bank details if available
    if (schoolSettings.bank_name && schoolSettings.account_number) {
      let bankInfo = `Bank: ${schoolSettings.bank_name}`;
      if (schoolSettings.account_name) {
        bankInfo += ` | A/C Name: ${schoolSettings.account_name}`;
      }
      bankInfo += ` | A/C No: ${schoolSettings.account_number}`;

      const bankLines = pdf.splitTextToSize(bankInfo, pageWidth - 30);
      bankLines.forEach((line, index) => {
        pdf.text(line, pageWidth / 2, pageHeight - 20 + index * 3, {
          align: "center",
        });
      });
    }

    pdf.text(
      `This is a ${
        previewData.isFinalized ? "finalized" : "draft"
      } bill • Generated on ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      pageHeight - 15,
      { align: "center" }
    );
    pdf.text(
      `${schoolSettings.school_name} - Official Fee Bill`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );

    // Save the PDF
    const fileName = `bill_${previewData.student.admission_number}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    pdf.save(fileName);

    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF");
  }
};

// Alternative method: Generate PDF from HTML element (for exact visual representation)
export const generatePDFFromElement = async (element, filename) => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;

    let pdfWidth = pageWidth - 20; // margin
    let pdfHeight = pdfWidth / ratio;

    if (pdfHeight > pageHeight) {
      pdfHeight = pageHeight - 20;
      pdfWidth = pdfHeight * ratio;
    }

    const x = (pageWidth - pdfWidth) / 2;
    const y = (pageHeight - pdfHeight) / 2;

    pdf.addImage(imgData, "PNG", x, y, pdfWidth, pdfHeight);
    pdf.save(filename || `bill_${Date.now()}.pdf`);

    return true;
  } catch (error) {
    console.error("Error generating PDF from element:", error);
    throw new Error("Failed to generate PDF from element");
  }
};

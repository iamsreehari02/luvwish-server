import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatCurrency } from "./formatCurrency.js";

export async function generatePdfBuffer({
  order,
  shippingCharge = 0,
  coinsUsed = 0,
  payableAmount = 0,
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let logoImage;
  try {
    const logoResponse = await fetch(
      "https://res.cloudinary.com/db1westwt/image/upload/v1749726008/luvwish_ao84jb.png"
    );
    const logoBytes = await logoResponse.arrayBuffer();
    logoImage = await pdfDoc.embedPng(logoBytes);
  } catch (error) {
    console.error("Failed to load logo:", error);
  }

  const marginLeft = 50;
  const marginRight = 50;
  let y = height - 40; // Start with proper top margin

  // HEADER SECTION - Logo and Invoice Info
  const headerStartY = y;

  if (logoImage) {
    // Position logo at left margin
    const logoY = headerStartY - logoImage.height;

    page.drawImage(logoImage, {
      x: marginLeft,
      y: logoY,
      width: logoImage.width,
      height: logoImage.height,
    });

    // Invoice info aligned with logo
    const currentDate = new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Align invoice text with top of logo
    page.drawText(
      `Invoice #: ${order._id.toString().slice(-8).toUpperCase()}`,
      {
        x: width - 220,
        y: headerStartY,
        size: 12,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      }
    );

    page.drawText(`Date: ${currentDate}`, {
      x: width - 220,
      y: headerStartY - 18,
      size: 12,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    y = logoY - 25; // Space after logo
  } else {
    // Fallback text logo
    page.drawText("LUVWISH", {
      x: marginLeft,
      y: headerStartY,
      size: 24,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    const currentDate = new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    page.drawText(
      `Invoice #: ${order._id.toString().slice(-8).toUpperCase()}`,
      {
        x: width - 220,
        y: headerStartY,
        size: 12,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      }
    );

    page.drawText(`Date: ${currentDate}`, {
      x: width - 220,
      y: headerStartY - 18,
      size: 12,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    y = headerStartY - 45;
  }

  // HEADER DIVIDER
  page.drawLine({
    start: { x: marginLeft, y },
    end: { x: width - marginRight, y },
    thickness: 1.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  y -= 25;

  // FROM and TO SECTION
  const fromX = marginLeft;
  const toX = width / 2 + 10;

  page.drawText("FROM", {
    x: fromX,
    y,
    size: 13,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawText("TO", {
    x: toX,
    y,
    size: 13,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  y -= 20;

  const fromAddress = [
    "LUVWISH",
    "LUVWISH KARINJALIPELLAM PALAKKAD",
    "CHITTUR, KERALA 678101",
    "India",
    "",
    "Email: luvwishes0@gmail.com",
    "Phone: +91 9562388698",
  ];

  const toAddress = [
    `${order.billingAddress.title || ""} ${
      order.billingAddress.firstName || ""
    } ${order.billingAddress.lastName || ""}`.trim(),
    order.billingAddress.street || "",
    `${order.billingAddress.city || ""}, ${order.billingAddress.state || ""}`,
    `${order.billingAddress.postcode || ""} ${
      order.billingAddress.country || ""
    }`,
    "",
    order.billingAddress.email ? `Email: ${order.billingAddress.email}` : "",
    order.billingAddress.phoneNumber
      ? `Phone: ${order.billingAddress.phoneNumber}`
      : "",
  ].filter((line) => line && line.trim() !== "" && line !== "undefined");

  const maxLines = Math.max(fromAddress.length, toAddress.length);
  for (let i = 0; i < maxLines; i++) {
    if (fromAddress[i]) {
      page.drawText(fromAddress[i], {
        x: fromX,
        y: y - i * 16,
        size: 10,
        font: i === 0 ? boldFont : font,
        color: i === 0 ? rgb(0.2, 0.2, 0.2) : rgb(0.4, 0.4, 0.4),
      });
    }
    if (toAddress[i]) {
      page.drawText(toAddress[i], {
        x: toX,
        y: y - i * 16,
        size: 10,
        font: i === 0 ? boldFont : font,
        color: i === 0 ? rgb(0.2, 0.2, 0.2) : rgb(0.4, 0.4, 0.4),
      });
    }
  }

  y -= maxLines * 16 + 25;

  // SECTION DIVIDER
  page.drawLine({
    start: { x: marginLeft, y },
    end: { x: width - marginRight, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 25;

  // ORDER DETAILS SECTION
  page.drawText("ORDER DETAILS", {
    x: marginLeft,
    y,
    size: 16,
    font: boldFont,
  });
  y -= 25;

  // Table headers with perfect alignment
  const itemX = marginLeft;
  const qtyX = width - 250;
  const priceX = width - 180;
  const totalX = width - 100;

  page.drawText("ITEM", {
    x: itemX,
    y,
    size: 11,
    font: boldFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  page.drawText("QTY", {
    x: qtyX,
    y,
    size: 11,
    font: boldFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  page.drawText("PRICE", {
    x: priceX,
    y,
    size: 11,
    font: boldFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  page.drawText("TOTAL", {
    x: totalX,
    y,
    size: 11,
    font: boldFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  y -= 5;

  // Table header line
  page.drawLine({
    start: { x: marginLeft, y },
    end: { x: width - marginRight, y },
    thickness: 0.8,
    color: rgb(0.6, 0.6, 0.6),
  });
  y -= 18;

  // Items with perfect alignment
  let subtotal = 0;
  order.items.forEach((item, index) => {
    const itemTotal = item.quantity * item.price;
    subtotal += itemTotal;

    page.drawText(item.product.name.substring(0, 35), {
      x: itemX,
      y,
      size: 10,
      font,
    });

    page.drawText(item.quantity.toString(), {
      x: qtyX,
      y,
      size: 10,
      font,
    });

    page.drawText(formatCurrency(item.price), {
      x: priceX,
      y,
      size: 10,
      font,
    });

    page.drawText(formatCurrency(itemTotal), {
      x: totalX,
      y,
      size: 10,
      font: boldFont,
    });

    y -= 18;
  });

  y -= 10;

  // Summary section with perfect alignment
  const summaryStartX = width - 280;
  const summaryValueX = width - 100;

  page.drawLine({
    start: { x: summaryStartX, y },
    end: { x: width - marginRight, y },
    thickness: 0.8,
    color: rgb(0.7, 0.7, 0.7),
  });
  y -= 20;

  // Summary rows function
  const drawSummaryRow = (label, value, isBold = false, isGreen = false) => {
    const textColor = isGreen ? rgb(0.2, 0.6, 0.2) : rgb(0.2, 0.2, 0.2);

    page.drawText(label, {
      x: summaryStartX,
      y,
      size: isBold ? 13 : 11,
      font: isBold ? boldFont : font,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(formatCurrency(value), {
      x: summaryValueX,
      y,
      size: isBold ? 13 : 11,
      font: isBold ? boldFont : font,
      color: textColor,
    });

    y -= isBold ? 22 : 18;
  };

  drawSummaryRow("Subtotal:", subtotal);
  if (shippingCharge > 0) drawSummaryRow("Shipping:", shippingCharge);
  if (coinsUsed > 0) drawSummaryRow("Coins Redeemed:", -coinsUsed, false, true); // Use negative to show it's a discount

  y -= 15;

  // Grand total line
  page.drawLine({
    start: { x: summaryStartX, y },
    end: { x: width - marginRight, y },
    thickness: 2,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 20;

  drawSummaryRow("GRAND TOTAL:", payableAmount, true);

  y -= 40;

  // Footer message
  page.drawText(
    "Thank you for shopping with us! We truly appreciate your support and trust in LUVWISH.",
    {
      x: marginLeft,
      y,
      size: 11,
      font,
      color: rgb(0.5, 0.5, 0.5),
    }
  );

  y -= 20;

  // Contact footer
  page.drawText(
    "For any queries, contact us at luvwishes0@gmail.com or +91 9562388698",
    {
      x: marginLeft,
      y,
      size: 9,
      font,
      color: rgb(0.6, 0.6, 0.6),
    }
  );

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

import { PDFDocument, StandardFonts } from "pdf-lib";

export async function generatePdfBuffer(order) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = height - 50;

  page.drawText("Order Invoice", { x: 50, y, size: 24, font });
  y -= 40;

  page.drawText(`Order ID: ${order._id}`, { x: 50, y, size: 14, font });
  y -= 20;

  page.drawText(`Ship To: ${order.shippingAddress.name || "N/A"}`, {
    x: 50,
    y,
    size: 14,
    font,
  });
  y -= 20;

  page.drawText(
    `Address: ${order.shippingAddress.street || ""}, ${
      order.shippingAddress.city || ""
    }, ${order.shippingAddress.postcode || ""}`,
    { x: 50, y, size: 12, font }
  );
  y -= 30;

  page.drawText("Items:", { x: 50, y, size: 16, font });
  y -= 20;

  order.items.forEach((item) => {
    page.drawText(`- ${item.product.name} x${item.quantity} @ ₹${item.price}`, {
      x: 60,
      y,
      size: 12,
      font,
    });
    y -= 15;
  });

  y -= 10;
  page.drawText(`Total Amount: ₹${order.totalAmount}`, {
    x: 50,
    y,
    size: 14,
    font,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export const orderConfirmationTemplate = (order) => `
  <div style="font-family: 'Arial', sans-serif; background-color: #fff4f8; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="text-align: center; padding-bottom: 20px;">
        <img src="https://i.ibb.co/FbWG37pc/IMG-9011-01-1.png" alt="Luvwish Logo" style="height: 60px;" />
        <h2 style="color: #d63384; margin-top: 10px;">Thank you for your order with Luvwish! ❤️</h2>
      </div>

      <p style="font-size: 16px; color: #444;">Hi <strong>${
        order.title
      }</strong>,</p>
      <p style="font-size: 15px; color: #555;">
        We truly appreciate your trust in <strong>Luvwish</strong>. Your order 
        <strong>#${
          order._id
        }</strong> was successfully placed on <strong>${new Date(
  order.createdAt
).toLocaleDateString()}</strong>.
      </p>

      <h3 style="color: #d63384; border-bottom: 1px solid #eee; padding-bottom: 5px;">🛍️ Order Summary</h3>
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${order.items
          .map(
            (item) => `
          <li style="margin-bottom: 15px; border: 1px solid #fce4ec; padding: 10px; border-radius: 8px;">
            <strong>Product:</strong> ${item.product.name || "Product"}<br />
            <strong>Quantity:</strong> ${item.quantity}<br />
            <strong>Price:</strong> ₹${item.price.toFixed(2)}
          </li>`
          )
          .join("")}
      </ul>

      <p style="font-size: 16px; margin-top: 15px;"><strong>Total:</strong> ₹${order.totalAmount.toFixed(
        2
      )}</p>

     <h3 style="color: #d63384; border-bottom: 1px solid #eee; padding-bottom: 5px;">📍 Billing Address</h3>
      <p style="font-size: 15px; color: #555;">
      ${order.billingAddress?.street || ""},<br />
      ${order.billingAddress?.houseNumber || ""},<br />
      ${order.billingAddress?.location || ""} - ${
  order.billingAddress?.postcode || ""
}
    </p>

      <div style="margin-top: 30px; background-color: #fff0f5; padding: 20px; border-radius: 10px;">
        <p style="color: #a8326d; font-size: 15px;">
          🌸 Have questions or need support? We’re here for you — just reply to this email or contact our team at <strong>Luvwish</strong>.
        </p>
      </div>

      <p style="font-size: 13px; color: #aaa; text-align: center; margin-top: 40px;">
        This is an automated message from <strong>Luvwish</strong>. Please do not reply directly to this email.
      </p>
      <p style="font-size: 12px; color: #bbb; text-align: center;">Luvwish &copy; ${new Date().getFullYear()} — Made with care 💖</p>
    </div>
  </div>
`;

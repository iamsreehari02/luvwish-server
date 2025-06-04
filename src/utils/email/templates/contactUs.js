export const contactUsTemplate = ({
  firstName,
  lastName,
  email,
  mobile,
  message,
}) => `
  <div style="font-family: 'Arial', sans-serif; background-color: #fff4f8; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="text-align: center; padding-bottom: 20px;">
        <img src="https://i.ibb.co/FbWG37pc/IMG-9011-01-1.png" alt="Luvwish Logo" style="height: 60px;" />
        <h2 style="color: #d63384; margin-top: 10px;">New Contact Request from Luvwish</h2>
      </div>

      <p style="font-size: 16px; color: #444;">
        You have received a new message via the Contact Us form on your website.
      </p>

      <h3 style="color: #d63384; border-bottom: 1px solid #eee; padding-bottom: 5px;">👤 Sender Details</h3>
      <p style="font-size: 15px; color: #555;">
        <strong>Name:</strong> ${firstName} ${lastName}<br />
        <strong>Email:</strong> ${email}<br />
        <strong>Mobile:</strong> ${mobile || "N/A"}
      </p>

      <h3 style="color: #d63384; border-bottom: 1px solid #eee; padding-bottom: 5px;">✉️ Message</h3>
      <p style="font-size: 15px; color: #555; white-space: pre-wrap;">
        ${message}
      </p>

      <div style="margin-top: 30px; background-color: #fff0f5; padding: 20px; border-radius: 10px;">
        <p style="color: #a8326d; font-size: 15px;">
          🌸 Reply to this email to get in touch with the sender directly.
        </p>
      </div>

      <p style="font-size: 13px; color: #aaa; text-align: center; margin-top: 40px;">
        This is an automated message from <strong>Luvwish</strong>.
      </p>
      <p style="font-size: 12px; color: #bbb; text-align: center;">
        Luvwish &copy; ${new Date().getFullYear()} — Made with care 💖
      </p>
    </div>
  </div>
`;

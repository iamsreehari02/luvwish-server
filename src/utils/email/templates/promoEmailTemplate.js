export const promoEmailTemplate = (code) => `
  <div style="font-family: 'Arial', sans-serif; background-color: #fff4f8; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="text-align: center; padding-bottom: 20px;">
        <img src="https://i.ibb.co/FbWG37pc/IMG-9011-01-1.png" alt="Luvwish Logo" style="height: 60px;" />
        <h2 style="color: #d63384; margin-top: 10px;">🎁 Welcome to Luvwish!</h2>
      </div>

      <p style="font-size: 16px; color: #444;">Hi there,</p>
      <p style="font-size: 15px; color: #555;">
        Thanks for signing up! As a special thank you, we're giving you an exclusive <strong>50% OFF</strong> on your first order.
      </p>

      <div style="margin: 20px 0; padding: 15px; background-color: #fff0f5; border-radius: 8px; text-align: center;">
        <p style="font-size: 16px; color: #a8326d; margin: 0;">Your Promo Code:</p>
        <p style="font-size: 24px; font-weight: bold; color: #d63384; margin: 10px 0;">${code}</p>
        <p style="font-size: 14px; color: #777;">Use this during checkout to claim your discount.</p>
      </div>

      <p style="font-size: 14px; color: #777;">This code is valid for one-time use and cannot be combined with other offers.</p>
      <p style="font-size: 13px; color: #aaa; text-align: center; margin-top: 40px;">
        This is an automated message from <strong>Luvwish</strong>. Please do not reply directly to this email.
      </p>
      <p style="font-size: 12px; color: #bbb; text-align: center;">Luvwish &copy; ${new Date().getFullYear()} — Made with love 💖</p>
    </div>
  </div>
`;

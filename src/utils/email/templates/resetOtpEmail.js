export const resetOtpEmailTemplate = (otp) => `
  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <h2 style="color: #d63384;">Reset Your Password</h2>
    <p style="font-size: 16px;">Use the OTP below to reset your password. It is valid for 10 minutes.</p>
    <h1 style="font-size: 28px; color: #333; margin: 20px 0;">${otp}</h1>
    <p>If you didn’t request this, you can ignore this email.</p>
    <p style="font-size: 14px; color: #aaa;">Luvwish &copy; ${new Date().getFullYear()}</p>
  </div>
`;

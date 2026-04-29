import { emailBaseStyles } from './email-base';

export const verifyOtpTemplate = (otp: string, userName: string, expiresInMinutes: number) => {
  const expiryLabel =
    expiresInMinutes >= 60
      ? `${Math.round(expiresInMinutes / 60)} hour${Math.round(expiresInMinutes / 60) > 1 ? 's' : ''}`
      : `${expiresInMinutes} minute${expiresInMinutes > 1 ? 's' : ''}`;

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Verify Your Email</title>
    <style>
      ${emailBaseStyles}
    </style>
  </head>

  <body>
    <div class="email-wrapper">
      <div class="email-container">
        <div class="email-header">
          <h2>Verify Email</h2>
        </div>

        <div class="email-content">
          <p class="greeting">Hey <strong>${userName}</strong>,</p>
          <p>To complete your email verification, use the one-time code below. This code will expire in <strong>${expiryLabel}</strong>.</p>

          <div class="otp-container">
            <div class="otp-label">Your Verification Code</div>
            <div class="otp-code">${otp}</div>
            <div class="otp-expiry">Valid for ${expiryLabel}</div>
          </div>

          <div class="notice">For your security, never share this code with anyone. If you didn't request this, you can safely ignore this email.</div>

          <p>Need help? Reach out to us at <strong>support@zonite.gg</strong></p>
        </div>

        <div class="email-footer">
          <p>© 2026 Zonite. All rights reserved.</p>
          <p style="font-size: 11px; margin-top: 8px;">Claim. Compete. Conquer.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;
};

import { emailBaseStyles } from './email-base';

export const verifyOtpTemplate = (otp: string, userName: string, expiresInMinutes: number) => {
  const expiryLabel =
    expiresInMinutes >= 60
      ? `${Math.round(expiresInMinutes / 60)} hour${Math.round(expiresInMinutes / 60) > 1 ? 's' : ''}`
      : `${expiresInMinutes} minute${expiresInMinutes > 1 ? 's' : ''}`;

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      ${emailBaseStyles}

      .email-header {
        background-color: transparent;
        padding: 20px 22px;
      }

      .email-header h2 {
        color: var(--accent-yellow);
      }
    </style>
  </head>

  <body>
    <div class="email-wrapper">
      <div class="email-container">
        <div class="email-header">
          <h2>Email Verification</h2>
        </div>

        <div class="email-content">
          <p><strong>Hello ${userName},</strong></p>
          <p>To complete your email verification, use the one-time code below.</p>

          <div class="otp-container">
            <div class="otp-label">Your verification code</div>
            <div class="otp-code">${otp}</div>
            <div class="otp-expiry">Valid for ${expiryLabel}</div>
          </div>

          <div class="notice">For security reasons, do not share this code. If you did not request this, ignore this email.</div>

          <p>If you need assistance, contact <strong>support@zonite.gg</strong>.</p>
        </div>

        <div class="email-footer">
          <p>© 2026 Zonite. All rights reserved.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;
};

import { emailBaseStyles } from './email-base';

export const passwordResetOtpTemplate = (
  otp: string,
  userName: string,
  expiresInMinutes: number,
) => {
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
    </style>
  </head>

  <body>
    <div class="email-wrapper">
      <div class="email-container">
        <div class="email-header">
          <h2>Reset Your Password</h2>
        </div>

        <div class="email-content">
          <p><strong>Hello ${userName},</strong></p>
          <p>We received a request to reset your password. Use the verification code below to continue.</p>

          <div class="otp-container">
            <div class="otp-label">Password reset code</div>
            <div class="otp-code">${otp}</div>
            <div class="otp-expiry">Valid for ${expiryLabel}</div>
          </div>

          <div class="notice">If you did not request a password reset, you can safely ignore this email.</div>
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

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
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Reset Your Password</title>
    <style>
      ${emailBaseStyles}
    </style>
  </head>

  <body>
    <div class="email-wrapper">
      <div class="email-container">
        <div class="email-header">
          <h2>Reset Password</h2>
        </div>

        <div class="email-content">
          <p class="greeting">Hey <strong>${userName}</strong>,</p>
          <p>We received a request to reset your password. Use the code below to continue. This code will expire in <strong>${expiryLabel}</strong>.</p>

          <div class="otp-container">
            <div class="otp-label">Password Reset Code</div>
            <div class="otp-code">${otp}</div>
            <div class="otp-expiry">Valid for ${expiryLabel}</div>
          </div>

          <div class="notice">If you did not request a password reset, you can safely ignore this email. Your account remains secure.</div>

          <p>Questions? Contact us at <strong>support@zonite.gg</strong></p>
        </div>

        <div class="email-footer">
          <p>© 2026 Zonite. All rights reserved.</p>
          <p style="font-size: 11px; margin-top: 8px;">Stay Safe. Play Hard. Win Big.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;
};

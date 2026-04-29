export const verifyOtpTemplate = (otp: string, userName: string, expiresInMinutes: number) => {
  const expiryLabel =
    expiresInMinutes >= 60
      ? `${Math.round(expiresInMinutes / 60)} hour${Math.round(expiresInMinutes / 60) > 1 ? 's' : ''}`
      : `${expiresInMinutes} minute${expiresInMinutes > 1 ? 's' : ''}`;

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>Verify Your Email</title>
  </head>
  <body style="margin:0;padding:0;font-family:'Mulish',Arial,Helvetica,sans-serif;color:#ffffff;-webkit-font-smoothing:antialiased;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background-color:#170e1b;border-radius:12px;border:1px solid rgba(255,255,255,0.05);overflow:hidden;">
            <!-- Header -->
            <tr>
              <td align="center" style="padding:32px 24px;background-color:#fdeb56;background-image:linear-gradient(135deg,#fdeb56,#f0c20c);">
                <h2 style="margin:0;font-family:'Bruno Ace SC','Courier New',Arial,sans-serif;font-size:24px;color:#100613;font-weight:700;letter-spacing:1px;line-height:1.2;">
                  VERIFY EMAIL
                </h2>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding:32px 24px;background-color:#170e1b;">
                <p style="margin:0 0 16px 0;font-family:'Mulish',Arial,Helvetica,sans-serif;font-size:16px;font-weight:600;color:#ffffff;line-height:1.4;">
                  Hey <span style="color:#fdeb56;">${userName}</span>,
                </p>

                <p style="margin:0 0 24px 0;font-family:'Mulish',Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.9);">
                  To complete your email verification, use the one-time code below. This code will expire in <strong style="color:#ffffff;">${expiryLabel}</strong>.
                </p>

                <!-- OTP Box -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;background-color:#1b1427;border:1px solid rgba(255,255,255,0.1);border-radius:8px;">
                  <tr>
                    <td align="center" style="padding:28px 24px;">
                      <p style="margin:0 0 12px 0;font-family:'Mulish',Arial,Helvetica,sans-serif;font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:2px;font-weight:600;">
                        Your Verification Code
                      </p>
                      <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:40px;font-weight:700;letter-spacing:8px;color:#fdeb56;line-height:1.2;">
                        ${otp}
                      </p>
                      <p style="margin:12px 0 0 0;font-family:'Mulish',Arial,Helvetica,sans-serif;font-size:12px;color:rgba(255,255,255,0.6);font-weight:500;">
                        Valid for ${expiryLabel}
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Notice -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;background-color:rgba(247,23,86,0.08);border-left:3px solid #f71756;border-radius:4px;">
                  <tr>
                    <td style="padding:14px 16px;font-family:'Mulish',Arial,Helvetica,sans-serif;font-size:13px;color:rgba(255,255,255,0.8);line-height:1.5;">
                      <strong style="color:#f71756;">⚠ Security Notice:</strong> Never share this code with anyone. If you didn't request this, you can safely ignore this email.
                    </td>
                  </tr>
                </table>

                <p style="margin:24px 0 0 0;font-family:'Mulish',Arial,Helvetica,sans-serif;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.5;">
                  Need help? Reach out to us at <a href="mailto:support@zonite.gg" style="color:#fdeb56;text-decoration:none;font-weight:600;">support@zonite.gg</a>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding:24px;background-color:#170e1b;border-top:1px solid rgba(255,255,255,0.05);">
                <p style="margin:0 0 6px 0;font-family:'Mulish',Arial,Helvetica,sans-serif;font-size:12px;color:rgba(255,255,255,0.5);font-weight:500;">
                  © 2026 Zonite. All rights reserved.
                </p>
                <p style="margin:0;font-family:'Bruno Ace SC','Courier New',Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:2px;">
                  CLAIM · COMPETE · CONQUER
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
};

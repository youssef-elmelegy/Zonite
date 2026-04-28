export const passwordResetOtpTemplate = (
  otp: string,
  userName: string,
  expiresInMinutes: number,
) => {
  const expiryLabel =
    expiresInMinutes >= 60
      ? `${expiresInMinutes / 60} hour${expiresInMinutes / 60 > 1 ? 's' : ''}`
      : `${expiresInMinutes} minute${expiresInMinutes > 1 ? 's' : ''}`;

  return `
    <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      :root{--ink-900: rgb(16,6,19);--accent-yellow: rgb(253,235,86);--fg-primary: rgba(255,255,255,1);--fg-secondary: rgba(255,255,255,0.9)}
      @import url('https://fonts.googleapis.com/css2?family=Mulish:wght@400;600;700&display=swap');
      body{margin:0;padding:0;background:var(--ink-900);font-family:Mulish,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--fg-secondary)}
      .outer{padding:28px 12px}
      .container{max-width:600px;margin:0 auto;background:linear-gradient(180deg,#2b1f2b,#20141a);border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.04)}
      .header{padding:24px;text-align:center;background:linear-gradient(90deg,var(--accent-yellow),#F0C20C)}
      .header h1{margin:0;font-size:22px;font-weight:700;color:var(--ink-900)}
      .content{padding:22px}
      p{margin:10px 0;font-size:14px;color:var(--fg-secondary)}
      .otp-box{margin:20px 0;padding:20px;background:rgba(14,124,123,0.06);border:2px solid rgba(14,124,123,0.18);text-align:center;border-radius:8px}
      .otp-label{font-size:13px;color:var(--fg-secondary);margin-bottom:8px}
      .otp-code{font-size:34px;font-weight:700;letter-spacing:6px;color:var(--accent-yellow);font-family:ui-monospace,monospace}
      .expiry{font-size:12px;color:var(--fg-secondary);margin-top:10px}
      .notice{margin:18px 0;padding:12px;background:transparent;border-left:4px solid rgba(255,255,255,0.03);font-size:13px}
      .footer{padding:16px;text-align:center;border-top:1px solid rgba(255,255,255,0.03);font-size:12px;color:rgba(255,255,255,0.6)}
    </style>
  </head>

  <body>
    <div class="outer">
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>

        <div class="content">
          <p style="font-weight:600;color:var(--fg-primary)">Hello ${userName},</p>
          <p>We received a request to reset your password. Use the verification code below to continue.</p>

          <div class="otp-box">
            <div class="otp-label">Password reset code</div>
            <p class="otp-code">${otp}</p>
            <div class="expiry">Valid for ${expiryLabel}</div>
          </div>

          <div class="notice">If you did not request a password reset, you can safely ignore this email.</div>
        </div>

        <div class="footer">
          <p>© 2026 Zonite. All rights reserved.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;
};

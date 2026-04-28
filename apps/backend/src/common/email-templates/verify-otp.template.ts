export const verifyOtpTemplate = (otp: string, userName: string, expiresInMinutes: number) => {
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
      :root{--ink-900: rgb(16,6,19);--ink-850: rgb(23,14,27);--accent-yellow: rgb(253,235,86);--accent-yellow-deep: rgb(240,194,12);--fg-primary: rgba(255,255,255,1);--fg-secondary: rgba(255,255,255,0.9)}
      @import url('https://fonts.googleapis.com/css2?family=Mulish:wght@400;600;700&display=swap');
      body{margin:0;padding:0;background:var(--ink-900);font-family:Mulish,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--fg-secondary)}
      .outer{padding:28px 12px}
      .container{max-width:600px;margin:0 auto;background:linear-gradient(180deg,var(--ink-850),#332234);border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.04)}
      .header{padding:20px;text-align:center;background:transparent}
      .header h1{margin:0;font-size:22px;font-weight:700;color:var(--accent-yellow)}
      .content{padding:22px;color:var(--fg-secondary)}
      p{margin:10px 0;font-size:14px}
      .otp-box{margin:20px 0;padding:18px;background:rgba(14,124,123,0.06);border:1px solid rgba(14,124,123,0.18);text-align:center;border-radius:6px}
      .otp-label{font-size:13px;color:var(--fg-secondary);margin-bottom:8px}
      .otp-code{font-size:34px;font-weight:700;letter-spacing:6px;font-family:ui-monospace,monospace;color:var(--accent-yellow)}
      .otp-expire{font-size:12px;color:var(--fg-secondary);margin-top:8px}
      .notice{margin:18px 0;padding:12px;background:transparent;border:1px solid rgba(255,255,255,0.03);font-size:13px}
      .footer{padding:16px;text-align:center;font-size:12px;color:rgba(255,255,255,0.6);border-top:1px solid rgba(255,255,255,0.03)}
    </style>
  </head>

  <body>
    <div class="outer">
      <div class="container">
        <div class="header">
          <h1>Email Verification</h1>
        </div>

        <div class="content">
          <p style="font-weight:600;color:var(--fg-primary)">Hello ${userName},</p>
          <p>To complete your email verification, use the one-time code below.</p>

          <div class="otp-box">
            <div class="otp-label">Your verification code</div>
            <div class="otp-code">${otp}</div>
            <div class="otp-expire">Valid for ${expiryLabel}</div>
          </div>

          <div class="notice">For security reasons, do not share this code. If you did not request this, ignore this email.</div>

          <p>If you need assistance, contact support@zonite.gg.</p>
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

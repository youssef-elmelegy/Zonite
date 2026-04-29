export const welcomeTemplate = (firstName: string) => {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>Welcome to Zonite</title>
  </head>
  <body style="margin:0;padding:0;font-family:'Mulish',Arial,Helvetica,sans-serif;color:#ffffff;-webkit-font-smoothing:antialiased;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background-color:#170e1b;border-radius:12px;border:1px solid rgba(255,255,255,0.05);overflow:hidden;">
            <!-- Header -->
            <tr>
              <td align="center" style="padding:32px 24px;background-color:#fdeb56;background-image:linear-gradient(135deg,#fdeb56,#f0c20c);">
                <h1 style="margin:0;font-family:'Bruno Ace SC','Courier New',Arial,sans-serif;font-size:32px;color:#100613;font-weight:700;letter-spacing:2px;line-height:1.2;">
                  ZONITE
                </h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding:32px 24px;background-color:#170e1b;">
                <p style="margin:0 0 16px 0;font-family:'Mulish',Arial,Helvetica,sans-serif;font-size:18px;font-weight:600;color:#ffffff;line-height:1.4;">
                  Welcome, <span style="color:#fdeb56;">${firstName}</span>!
                </p>

                <p style="margin:0 0 16px 0;font-family:'Mulish',Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.9);">
                  Thanks for joining <strong style="color:#ffffff;">Zonite</strong> — your account is ready. Jump in and start claiming blocks, racking up XP, and climbing the leaderboard.
                </p>

                <!-- CTA Button -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
                  <tr>
                    <td align="center" style="background-color:#fdeb56;border-radius:8px;">
                      <a href="https://zonite.gg" style="display:inline-block;padding:14px 32px;font-family:'Mulish',Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#100613;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">
                        Open Zonite
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Divider -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;">
                  <tr>
                    <td style="height:1px;background-color:rgba(255,255,255,0.1);line-height:1px;font-size:1px;">&nbsp;</td>
                  </tr>
                </table>

                <p style="margin:0;font-family:'Mulish',Arial,Helvetica,sans-serif;font-size:12px;color:rgba(255,255,255,0.6);line-height:1.5;font-style:italic;">
                  Get ready to battle. Claim your territory. Dominate the grid.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding:24px;background-color:#170e1b;border-top:1px solid rgba(255,255,255,0.05);">
                <p style="margin:0 0 6px 0;font-family:'Mulish',Arial,Helvetica,sans-serif;font-size:12px;color:rgba(255,255,255,0.5);font-weight:500;">
                  © 2026 Zonite. All rights reserved.
                </p>
                <p style="margin:0;font-family:'Mulish',Arial,Helvetica,sans-serif;font-size:12px;color:rgba(255,255,255,0.5);">
                  Questions? <a href="mailto:support@zonite.gg" style="color:#fdeb56;text-decoration:none;font-weight:600;">support@zonite.gg</a>
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

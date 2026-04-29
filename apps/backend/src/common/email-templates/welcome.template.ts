import { emailBaseStyles } from './email-base';

export const welcomeTemplate = (firstName: string) => {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Welcome to Zonite</title>
    <style>
      ${emailBaseStyles}
    </style>
  </head>

  <body>
    <div class="email-wrapper">
      <div class="email-container">
        <div class="email-header">
          <h1>ZONITE</h1>
        </div>

        <div class="email-content">
          <p class="greeting">Welcome, <strong>${firstName}</strong>!</p>
          <p>Thanks for joining <strong>Zonite</strong> — your account is ready. Jump in and start claiming blocks, racking up XP, and climbing the leaderboard.</p>

          <a href="https://zonite.gg" class="cta-button">Open Zonite</a>

          <div class="divider"></div>

          <p style="font-size: 12px; color: var(--fg-muted); margin: 16px 0 0;">
            Get ready to battle. Claim your territory. Dominate the grid.
          </p>
        </div>

        <div class="email-footer">
          <p>© 2026 Zonite. All rights reserved.</p>
          <p>Questions? Contact <strong>support@zonite.gg</strong></p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;
};

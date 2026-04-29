import { emailBaseStyles } from './email-base';

export const welcomeTemplate = (firstName: string) => {
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
          <h1>Zonite</h1>
        </div>

        <div class="email-content">
          <div class="greeting">Welcome, ${firstName}!</div>
          <p>Thanks for joining Zonite — your account is ready. Jump in and start claiming blocks, racking up XP, and climbing the leaderboard.</p>
          <a href="https://zonite.gg" class="cta-button">Open Zonite</a>
        </div>

        <div class="email-footer">
          <p>© 2026 Zonite. All rights reserved.</p>
          <p>Support: support@zonite.gg</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;
};

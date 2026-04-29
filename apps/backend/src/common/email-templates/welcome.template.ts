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
      :root {
        --ink-900: rgb(16, 6, 19);
        --ink-850: rgb(23, 14, 27);
        --ink-800: rgb(27, 20, 39);
        --accent-yellow: rgb(253, 235, 86);
        --accent-yellow-deep: rgb(240, 194, 12);
        --fg-primary: rgb(255, 255, 255);
        --fg-secondary: rgba(255, 255, 255, 0.9);
        --fg-tertiary: rgba(255, 255, 255, 0.6);
        --fg-muted: rgba(255, 255, 255, 0.3);
        --border-subtle: rgba(255, 255, 255, 0.05);
      }

      @import url('https://fonts.googleapis.com/css2?family=Bruno+Ace+SC&family=Mulish:wght@400;500;600;700&display=swap');

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 0;
        font-family: Mulish, system-ui, -apple-system, 'Segoe UI', sans-serif;
        background-color: var(--ink-900);
        color: var(--fg-primary);
        line-height: 1.6;
      }

      .email-wrapper {
        padding: 32px 16px;
        background-color: var(--ink-900);
      }

      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: var(--ink-850);
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--border-subtle);
      }

      .email-header {
        padding: 28px 24px;
        text-align: center;
        background: linear-gradient(135deg, var(--accent-yellow), var(--accent-yellow-deep));
      }

      .email-header h1 {
        margin: 0;
        font-family: 'Bruno Ace SC', sans-serif;
        font-size: 32px;
        color: var(--ink-900);
        font-weight: 700;
        letter-spacing: 0.05em;
      }

      .email-content {
        padding: 28px 24px;
      }

      .email-content p {
        margin: 12px 0;
        font-size: 14px;
        line-height: 1.6;
        color: var(--fg-secondary);
        font-weight: 400;
      }

      .email-content strong {
        color: var(--fg-primary);
        font-weight: 600;
      }

      .greeting {
        font-size: 16px;
        font-weight: 600;
        color: var(--fg-primary);
        margin-bottom: 16px;
      }

      .cta-button {
        display: inline-block;
        margin-top: 16px;
        padding: 12px 24px;
        background-color: var(--accent-yellow);
        color: var(--ink-900);
        border-radius: 8px;
        text-decoration: none;
        font-weight: 700;
        font-size: 14px;
        font-family: Mulish, sans-serif;
        letter-spacing: 0.02em;
      }

      .divider {
        margin: 24px 0;
        height: 1px;
        background-color: var(--border-subtle);
      }

      .email-footer {
        padding: 20px 24px;
        text-align: center;
        font-size: 12px;
        color: var(--fg-muted);
        border-top: 1px solid var(--border-subtle);
        background-color: transparent;
      }

      .email-footer p {
        margin: 6px 0;
        font-weight: 500;
      }
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

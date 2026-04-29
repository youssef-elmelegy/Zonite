export const emailBaseStyles = `
  :root {
    --ink-900: rgb(16, 6, 19);
    --ink-850: rgb(23, 14, 27);
    --ink-800: rgb(27, 20, 39);
    --ink-700: rgb(39, 29, 39);
    --accent-yellow: rgb(253, 235, 86);
    --accent-yellow-deep: rgb(240, 194, 12);
    --fire-red: rgb(247, 23, 86);
    --fire-pink: rgb(248, 29, 74);
    --magenta-500: rgb(188, 90, 215);
    --team-red: rgb(247, 23, 86);
    --team-blue: rgb(55, 234, 246);
    --lime-400: rgb(75, 255, 84);
    --cyan-400: rgb(55, 234, 246);
    --sky-300: rgb(142, 201, 237);
    --fg-primary: rgb(255, 255, 255);
    --fg-secondary: rgba(255, 255, 255, 0.9);
    --fg-tertiary: rgba(255, 255, 255, 0.6);
    --fg-muted: rgba(255, 255, 255, 0.3);
    --border-subtle: rgba(255, 255, 255, 0.05);
    --border-default: rgba(255, 255, 255, 0.1);
    --border-strong: rgba(255, 255, 255, 0.3);
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

  .email-header h2 {
    margin: 0;
    font-family: 'Bruno Ace SC', sans-serif;
    font-size: 24px;
    color: var(--ink-900);
    font-weight: 700;
    letter-spacing: 0.02em;
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
    transition: background-color 0.2s;
  }

  .otp-container {
    margin: 24px 0;
    padding: 24px;
    background-color: var(--ink-800);
    border: 1px solid var(--border-default);
    text-align: center;
    border-radius: 8px;
  }

  .otp-label {
    font-size: 12px;
    color: var(--fg-muted);
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .otp-code {
    font-size: 40px;
    font-weight: 700;
    letter-spacing: 8px;
    font-family: 'Courier New', monospace;
    color: var(--accent-yellow);
    margin: 0;
    line-height: 1.2;
  }

  .otp-expiry {
    font-size: 12px;
    color: var(--fg-tertiary);
    margin-top: 12px;
    font-weight: 500;
  }

  .notice {
    margin: 20px 0;
    padding: 14px 16px;
    background-color: rgba(247, 23, 86, 0.05);
    border-left: 3px solid var(--fire-red);
    border-radius: 4px;
    font-size: 13px;
    color: var(--fg-tertiary);
    line-height: 1.5;
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
`;

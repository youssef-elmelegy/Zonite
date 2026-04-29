export const emailBaseStyles = `
  :root {
    --ink-900: rgb(16, 6, 19);
    --ink-850: rgb(23, 14, 27);
    --ink-700: rgb(39, 29, 39);
    --accent-yellow: rgb(253, 235, 86);
    --accent-yellow-deep: rgb(240, 194, 12);
    --fg-primary: rgba(255, 255, 255, 1);
    --fg-secondary: rgba(255, 255, 255, 0.9);
    --fg-tertiary: rgba(255, 255, 255, 0.6);
    --border-subtle: rgba(255, 255, 255, 0.05);
    --border-subtle-light: rgba(255, 255, 255, 0.03);
  }

  @import url('https://fonts.googleapis.com/css2?family=Mulish:wght@400;600;700&display=swap');

  * {
    margin: 0;
    padding: 0;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: Mulish, system-ui, -apple-system, 'Segoe UI', sans-serif;
    background-color: var(--ink-900);
    color: var(--fg-primary);
  }

  .email-wrapper {
    padding: 28px 12px;
  }

  .email-container {
    max-width: 600px;
    margin: 0 auto;
    background: linear-gradient(180deg, var(--ink-850), var(--ink-700));
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--border-subtle);
  }

  .email-header {
    padding: 22px;
    text-align: center;
    background: linear-gradient(90deg, var(--accent-yellow), var(--accent-yellow-deep));
  }

  .email-header h1 {
    margin: 0;
    font-family: 'Bruno Ace SC', Mulish, sans-serif;
    font-size: 28px;
    color: var(--ink-900);
    font-weight: 700;
  }

  .email-header h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    color: var(--ink-900);
  }

  .email-content {
    padding: 22px;
    color: var(--fg-secondary);
  }

  .email-content p {
    margin: 10px 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--fg-secondary);
  }

  .greeting {
    font-size: 16px;
    font-weight: 700;
    color: var(--fg-primary);
    margin-bottom: 12px;
  }

  .cta-button {
    display: inline-block;
    margin-top: 12px;
    padding: 10px 16px;
    background-color: var(--accent-yellow);
    color: var(--ink-900);
    border-radius: 6px;
    text-decoration: none;
    font-weight: 700;
    font-size: 14px;
  }

  .otp-container {
    margin: 20px 0;
    padding: 18px;
    background-color: rgba(14, 124, 123, 0.06);
    border: 1px solid rgba(14, 124, 123, 0.18);
    text-align: center;
    border-radius: 6px;
  }

  .otp-label {
    font-size: 13px;
    color: var(--fg-secondary);
    margin-bottom: 8px;
  }

  .otp-code {
    font-size: 34px;
    font-weight: 700;
    letter-spacing: 6px;
    font-family: 'Courier New', monospace;
    color: var(--accent-yellow);
  }

  .otp-expiry {
    font-size: 12px;
    color: var(--fg-secondary);
    margin-top: 8px;
  }

  .notice {
    margin: 18px 0;
    padding: 12px;
    background-color: transparent;
    border: 1px solid var(--border-subtle-light);
    border-radius: 6px;
    font-size: 13px;
    color: var(--fg-tertiary);
  }

  .email-footer {
    padding: 16px;
    text-align: center;
    font-size: 12px;
    color: var(--fg-tertiary);
    border-top: 1px solid var(--border-subtle-light);
    background-color: transparent;
  }

  .email-footer p {
    margin: 4px 0;
  }
`;

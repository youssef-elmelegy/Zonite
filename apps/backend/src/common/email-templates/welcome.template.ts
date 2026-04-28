export const welcomeTemplate = (firstName: string) => {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      /* Design tokens (safe for email clients) */
      :root{
        --ink-900: rgb(16,6,19);
        --ink-850: rgb(23,14,27);
        --ink-700: rgb(39,29,39);
        --accent-yellow: rgb(253,235,86);
        --accent-yellow-deep: rgb(240,194,12);
        --fg-primary: rgba(255,255,255,1);
        --fg-secondary: rgba(255,255,255,0.9);
        --fg-tertiary: rgba(255,255,255,0.6);
        --border-subtle: rgba(255,255,255,0.05);
      }

      @import url('https://fonts.googleapis.com/css2?family=Mulish:wght@400;600;700&display=swap');

      body{
        margin:0;padding:0;font-family: Mulish, system-ui, -apple-system, "Segoe UI", sans-serif;
        background: var(--ink-900); color: var(--fg-primary);
      }

      .outer{padding:28px 12px}
      .container{max-width:600px;margin:0 auto;background:linear-gradient(180deg,var(--ink-850),var(--ink-700));border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.04)}

      .header{background:linear-gradient(90deg,var(--accent-yellow),var(--accent-yellow-deep));padding:22px;text-align:center}
      .header h1{margin:0;font-family: "Bruno Ace SC", Mulish, sans-serif;font-size:28px;color:var(--ink-900)}

      .content{padding:22px;color:var(--fg-secondary)}
      .greeting{font-size:16px;font-weight:700;color:var(--fg-primary);margin-bottom:12px}
      p{margin:10px 0;font-size:14px;line-height:1.5;color:var(--fg-secondary)}

      .cta{display:inline-block;margin-top:12px;padding:10px 16px;background:var(--accent-yellow);color:var(--ink-900);border-radius:6px;text-decoration:none;font-weight:700}

      .footer{padding:16px;text-align:center;font-size:12px;color:var(--fg-tertiary);border-top:1px solid rgba(255,255,255,0.03);background:transparent}
    </style>
  </head>

  <body>
    <div class="outer">
      <div class="container">
        <div class="header">
          <h1>Zonite</h1>
        </div>

        <div class="content">
          <div class="greeting">Welcome, ${firstName}</div>
          <p>Thanks for joining Zonite — your account is ready. Jump in and start claiming blocks, racking up XP, and climbing the leaderboard.</p>
          <a href="https://zonite.gg" class="cta">Open Zonite</a>
        </div>

        <div class="footer">
          <p>© 2026 Zonite. All rights reserved.</p>
          <p>Support: support@zonite.gg</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;
};

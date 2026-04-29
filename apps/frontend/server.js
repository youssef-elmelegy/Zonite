import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const distDir = `${__dirname}/dist`;

// Serve static files
app.use(express.static(distDir));

// SPA fallback - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(`${distDir}/index.html`);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Frontend running on port ${port}`);
  console.log(`Serving from: ${distDir}`);
  console.log(`Dist exists: ${existsSync(distDir)}`);
});

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, 'dist');

const app = express();

// Serve static files
app.use(express.static(distPath));

// SPA fallback
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('dist/index.html not found');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Frontend running on port ${port}`);
  console.log(`Serving from: ${distPath}`);
  console.log(`Dist exists: ${fs.existsSync(distPath)}`);
});

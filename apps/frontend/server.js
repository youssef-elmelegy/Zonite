import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, 'dist');
const indexHtml = path.resolve(distDir, 'index.html');

console.log('distDir:', distDir);
console.log('index.html exists:', fs.existsSync(indexHtml));

const app = express();

app.use(express.static(distDir));

// Express 5 requires named wildcard — bare '*' throws TypeError on startup
app.get('/{*path}', (req, res) => {
  res.sendFile(indexHtml, (err) => {
    if (err) {
      console.error('sendFile error:', err);
      res.status(500).send('Server error');
    }
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, _next) => {
  console.error('Express error:', err);
  res.status(500).send('Server error');
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Frontend listening on port ${port}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

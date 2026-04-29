import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, 'dist');

const app = express();

// Serve static files from dist
app.use(express.static(distDir));

// SPA fallback - serve index.html for all routes
app.get('*', (req, res) => {
  try {
    res.sendFile(path.resolve(distDir, 'index.html'));
  } catch (err) {
    console.error('Error sending file:', err);
    res.status(500).send('Server error');
  }
});

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).send('Server error');
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`✓ Frontend listening on port ${port}`);
  console.log(`✓ Dist directory: ${distDir}`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

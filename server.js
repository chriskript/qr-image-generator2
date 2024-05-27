import express from 'express';
import qr from 'qr-image';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;

// Get the directory name of the current module file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to generate QR code
app.get('/generate', (req, res) => {
  const url = req.query.q;
  if (!url) {
    return res.status(400).send('URL is required');
  }

  try {
    const qrImage = qr.image(url, { type: 'png' });
    res.type('png');
    qrImage.pipe(res);
  } catch (error) {
    res.status(500).send('Error generating QR code');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

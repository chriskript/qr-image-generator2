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

// Endpoint to generate QR code for URL
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

// Helper function to generate vCard string
function generateVCard({ firstName, lastName, phone, email, organization, title, website, address }) {
  let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
  vcard += `N:${lastName || ''};${firstName || ''};;;\n`;
  vcard += `FN:${firstName || ''} ${lastName || ''}\n`;
  if (phone) vcard += `TEL:${phone}\n`;
  if (email) vcard += `EMAIL:${email}\n`;
  if (organization) vcard += `ORG:${organization}\n`;
  if (title) vcard += `TITLE:${title}\n`;
  if (website) vcard += `URL:${website}\n`;
  if (address) vcard += `ADR:;;${address};;;;\n`;
  vcard += 'END:VCARD';
  return vcard;
}

// Endpoint to generate QR code for vCard
app.get('/generate-vcard-qr', (req, res) => {
  const { firstName, lastName, phone, email, organization, title, website, address } = req.query;

  if (!firstName && !lastName && !phone && !email) {
    return res.status(400).send('At least one contact field is required');
  }

  try {
    const vcardString = generateVCard({ firstName, lastName, phone, email, organization, title, website, address });
    const qrImage = qr.image(vcardString, { type: 'png' });
    res.type('png');
    qrImage.pipe(res);
  } catch (error) {
    res.status(500).send('Error generating QR code');
  }
});

// Endpoint to generate and download vCard file
app.get('/download-vcard', (req, res) => {
  const { firstName, lastName, phone, email, organization, title, website, address } = req.query;

  if (!firstName && !lastName && !phone && !email) {
    return res.status(400).send('At least one contact field is required');
  }

  try {
    const vcardString = generateVCard({ firstName, lastName, phone, email, organization, title, website, address });
    const fileName = `${firstName || 'contact'}_${lastName || 'vcard'}.vcf`.replace(/\s+/g, '_');

    res.setHeader('Content-Type', 'text/vcard');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(vcardString);
  } catch (error) {
    res.status(500).send('Error generating vCard');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

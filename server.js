import express from 'express';
import qr from 'qr-image';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

const app = express();
const port = 3000;

// Security: Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Security: Body parsing for POST requests
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Get the directory name of the current module file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Security: Input validation helpers
const MAX_INPUT_LENGTH = 500;
const MAX_URL_LENGTH = 2000;

function sanitizeString(str) {
  if (!str || typeof str !== 'string') return '';
  return str.slice(0, MAX_INPUT_LENGTH).trim();
}

function validateUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.length > MAX_URL_LENGTH) return null;
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function escapeVCard(str) {
  if (!str) return '';
  // Escape vCard special characters: backslash, comma, semicolon, newline
  return str
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

function sanitizeFilename(str) {
  if (!str) return '';
  // Remove potentially dangerous characters for filenames
  return str
    .slice(0, 50)
    .replace(/[<>"|?*]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

// Endpoint to generate QR code for URL
app.get('/generate', (req, res) => {
  const url = req.query.q;
  const validatedUrl = validateUrl(url);
  
  if (!validatedUrl) {
    return res.status(400).send('Valid HTTP/HTTPS URL is required');
  }

  try {
    const qrImage = qr.image(validatedUrl, { type: 'png' });
    res.type('png');
    qrImage.pipe(res);
  } catch (error) {
    res.status(500).send('Error generating QR code');
  }
});

// Helper function to generate vCard string with security escaping
function generateVCard({ firstName, lastName, phone, email, organization, title, website, address }) {
  let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
  vcard += `N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;\n`;
  vcard += `FN:${escapeVCard(firstName)} ${escapeVCard(lastName)}\n`;
  if (phone) vcard += `TEL:${escapeVCard(phone)}\n`;
  if (email) vcard += `EMAIL:${escapeVCard(email)}\n`;
  if (organization) vcard += `ORG:${escapeVCard(organization)}\n`;
  if (title) vcard += `TITLE:${escapeVCard(title)}\n`;
  if (website) vcard += `URL:${escapeVCard(website)}\n`;
  if (address) vcard += `ADR:;;${escapeVCard(address)};;;;\n`;
  vcard += 'END:VCARD';
  return vcard;
}

// Security: POST endpoint to keep contact data out of logs and URL history
app.post('/generate-vcard-qr', (req, res) => {
  // Sanitize all inputs
  const firstName = sanitizeString(req.body.firstName);
  const lastName = sanitizeString(req.body.lastName);
  const phone = sanitizeString(req.body.phone);
  const email = sanitizeString(req.body.email);
  const organization = sanitizeString(req.body.organization);
  const title = sanitizeString(req.body.title);
  const website = sanitizeString(req.body.website);
  const address = sanitizeString(req.body.address);

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

// Security: POST endpoint for vCard download to keep data out of logs
app.post('/download-vcard', (req, res) => {
  // Sanitize all inputs
  const firstName = sanitizeString(req.body.firstName);
  const lastName = sanitizeString(req.body.lastName);
  const phone = sanitizeString(req.body.phone);
  const email = sanitizeString(req.body.email);
  const organization = sanitizeString(req.body.organization);
  const title = sanitizeString(req.body.title);
  const website = sanitizeString(req.body.website);
  const address = sanitizeString(req.body.address);

  if (!firstName && !lastName && !phone && !email) {
    return res.status(400).send('At least one contact field is required');
  }

  try {
    const vcardString = generateVCard({ firstName, lastName, phone, email, organization, title, website, address });
    // Security: Sanitize filename to prevent directory traversal
    const safeFirstName = sanitizeFilename(firstName) || 'contact';
    const safeLastName = sanitizeFilename(lastName) || 'vcard';
    const fileName = `${safeFirstName}_${safeLastName}.vcf`;

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

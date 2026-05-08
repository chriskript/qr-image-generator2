import 'dotenv/config';
import express from 'express';
import qr from 'qr-image';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';

const app = express();
const port = process.env.PORT || 3000;
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX, 10) || 100;
const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000;

// Security: Compression for performance
app.use(compression());

// Security: Helmet security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://cloud.umami.is"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://api-gateway.umami.dev"],
    },
  },
}));

// Security: Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMax,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Security: Body parsing for POST requests (increased limit for base64 photos)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Get the directory name of the current module file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the 'public' directory with long-term caching
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));

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
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    qrImage.pipe(res);
  } catch (error) {
    res.status(500).send('Error generating QR code');
  }
});

// Helper function to generate vCard string for QR code (compact, no photo)
function generateVCardQR({ firstName, lastName, phone, email, organization, title, website, address }) {
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

// Helper function to generate vCard string for download (includes photo)
function generateVCardDownload({ firstName, lastName, phone, email, organization, title, website, address, photo }) {
  let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
  vcard += `N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;\n`;
  vcard += `FN:${escapeVCard(firstName)} ${escapeVCard(lastName)}\n`;
  if (phone) vcard += `TEL:${escapeVCard(phone)}\n`;
  if (email) vcard += `EMAIL:${escapeVCard(email)}\n`;
  if (organization) vcard += `ORG:${escapeVCard(organization)}\n`;
  if (title) vcard += `TITLE:${escapeVCard(title)}\n`;
  if (website) vcard += `URL:${escapeVCard(website)}\n`;
  if (address) vcard += `ADR:;;${escapeVCard(address)};;;;\n`;
  if (photo) vcard += `PHOTO;ENCODING=b;TYPE=JPEG:${photo.replace(/^data:image\/jpeg;base64,/, '')}\n`;
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
  const photo = req.body.photo || null;

  if (!firstName && !lastName && !phone && !email) {
    return res.status(400).send('At least one contact field is required');
  }

  try {
    // QR code gets compact vCard without photo to stay scannable
    const vcardString = generateVCardQR({ firstName, lastName, phone, email, organization, title, website, address });
    console.log('vCard QR length:', vcardString.length);
    const qrImage = qr.image(vcardString, { type: 'png' });
    res.type('png');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    qrImage.pipe(res);
  } catch (error) {
    console.error('QR generation error:', error.message);
    res.status(500).send('Error generating QR code: ' + error.message);
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
  const photo = req.body.photo || null;

  if (!firstName && !lastName && !phone && !email) {
    return res.status(400).send('At least one contact field is required');
  }

  try {
    // Download gets full vCard with embedded photo
    const vcardString = generateVCardDownload({ firstName, lastName, phone, email, organization, title, website, address, photo });
    console.log('vCard download length:', vcardString.length);
    // Security: Sanitize filename to prevent directory traversal
    const safeFirstName = sanitizeFilename(firstName) || 'contact';
    const safeLastName = sanitizeFilename(lastName) || 'vcard';
    const fileName = `${safeFirstName}_${safeLastName}.vcf`;

    res.setHeader('Content-Type', 'text/vcard');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(vcardString);
  } catch (error) {
    console.error('vCard download error:', error.message);
    res.status(500).send('Error generating vCard: ' + error.message);
  }
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

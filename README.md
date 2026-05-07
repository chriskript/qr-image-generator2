# QR Image Generator

A web application that generates QR codes from URLs and contact cards in vCard format.

## Features

- Generate QR codes from any URL
- Generate QR codes for contact cards (vCard format)
- Download vCard files (.vcf)
- Web interface for easy input
- REST API endpoints for programmatic access
- PNG image output

## Installation

```bash
npm install
```

## Usage

### Start the server

```bash
node server.js
```

The server will start at `http://localhost:3000`

### Web Interface

Open `http://localhost:3000` in your browser:

- **URL QR Code**: Enter a URL and generate a QR code
- **Contact QR Code**: Enter contact details and generate a vCard QR code or download the .vcf file

### API Endpoints

#### Generate URL QR Code

```bash
curl "http://localhost:3000/generate?q=https://example.com" -o qr.png
```

#### Generate vCard QR Code

```bash
curl "http://localhost:3000/generate-vcard-qr?firstName=John&lastName=Doe&phone=1234567890&email=john@example.com" -o contact-qr.png
```

#### Download vCard File

```bash
curl "http://localhost:3000/download-vcard?firstName=John&lastName=Doe&phone=1234567890&email=john@example.com" -o contact.vcf
```

## Project Structure

```
.
├── server.js          # Express server with QR generation endpoint
├── public/
│   ├── index.html     # Web interface
│   ├── script.js      # Frontend JavaScript
│   └── styles.css     # Styling
├── package.json       # Dependencies
└── .gitignore         # Git ignore rules
```

## Dependencies

- [express](https://expressjs.com/) - Web framework
- [qr-image](https://github.com/alexeyten/qr-image) - QR code generation
- [inquirer](https://github.com/SBoudrias/Inquirer.js/) - Interactive command line prompts

## License

ISC
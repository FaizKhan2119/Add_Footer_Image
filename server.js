const express = require('express');
const Jimp = require('jimp');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

app.post('/add-footer', upload.single('image'), async (req, res) => {
  try {
    const { name, contact, email, address, companyName, logoUrl } = req.body;
    const imageBuffer = req.file?.buffer;

    if (!imageBuffer) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const image = await Jimp.read(imageBuffer);
    let logo = null;

    if (logoUrl) {
      try {
        const response = await axios.get(logoUrl, { responseType: 'arraybuffer' });
        logo = await Jimp.read(Buffer.from(response.data));
      } catch (e) {
        console.warn('Failed to load logo from URL:', logoUrl);
      }
    }

    const footerHeight = 150;
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    const footer = new Jimp(width, footerHeight, '#ffffff');
    const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
    const boldFont = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

    // Two-column layout
    const leftText = `Name: ${name || 'N/A'}\nContact: ${contact || 'N/A'}`;
    const rightText = `Email: ${email || 'N/A'}\nAddress: ${address || 'N/A'}`;

    footer.print(font, 10, 10, leftText);
    footer.print(font, width / 2 + 10, 10, rightText);

    // Logo and company name in footer center
    if (logo) {
      logo.resize(60, 60);
      footer.composite(logo, width / 2 - 100, 80);
    }

    if (companyName) {
      footer.print(boldFont, width / 2 - 30, 90, companyName);
    }

    const combined = new Jimp(width, height + footerHeight);
    combined.composite(image, 0, 0);
    combined.composite(footer, 0, height);

    const buffer = await combined.getBufferAsync(Jimp.MIME_JPEG);
    res.set('Content-Type', 'image/jpeg');
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

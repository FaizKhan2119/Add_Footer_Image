// server.js
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
    const {
      name,
      title,
      phone,
      email,
      website,
      address,
      logoUrl,
      personImageUrl
    } = req.body;

    const imageBuffer = req.file?.buffer;
    if (!imageBuffer) return res.status(400).json({ error: 'Image is required' });

    const mainImage = await Jimp.read(imageBuffer);
    const width = mainImage.bitmap.width;
    const footerHeight = 250;
    const footer = new Jimp(width, footerHeight, '#DFF2F8');

    // Use built-in font and scale text manually
    const baseFont = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

    // Draw scaled text
    const printText = async (text, scale, yOffset) => {
      const temp = new Jimp(1, 1);
      const textWidth = Jimp.measureText(baseFont, text);
      const textHeight = Jimp.measureTextHeight(baseFont, text, textWidth);
      const textImage = new Jimp(textWidth, textHeight);
      textImage.print(baseFont, 0, 0, text);
      textImage.scale(scale);
      const x = (width - textImage.bitmap.width) / 2;
      footer.composite(textImage, x, yOffset);
      return yOffset + textImage.bitmap.height + 10;
    };

    // Left Side: Person Image Circle (larger and shifted right)
    if (personImageUrl) {
      const personResp = await axios.get(personImageUrl, { responseType: 'arraybuffer' });
      const person = await Jimp.read(Buffer.from(personResp.data));
      person.circle().resize(160, 160);
      footer.composite(person, 60, 45);
    }

    // Print all text lines
    let textY = 30;
    textY = await printText(name, 2, textY);     // ~64px
    textY = await printText(title, 1.5, textY);  // ~48px
    textY = await printText(phone, 1, textY);    // ~32px
    textY = await printText(email, 1, textY);
    textY = await printText(website, 1, textY);
    textY = await printText(address, 1, textY);

    // Right Side: Logo
    if (logoUrl) {
      const logoResp = await axios.get(logoUrl, { responseType: 'arraybuffer' });
      const logo = await Jimp.read(Buffer.from(logoResp.data));
      logo.contain(100, 100);
      footer.composite(logo, width - 130, 60);
    }

    // Combine base image and footer
    const finalImage = new Jimp(width, mainImage.bitmap.height + footerHeight);
    finalImage.composite(mainImage, 0, 0);
    finalImage.composite(footer, 0, mainImage.bitmap.height);

    const buffer = await finalImage.getBufferAsync(Jimp.MIME_JPEG);
    res.set('Content-Type', 'image/jpeg');
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong', details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

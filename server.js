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
    const footerHeight = 200;
    const footer = new Jimp(width, footerHeight, '#DFF2F8');

    // Fonts
    const fontBig = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const fontMed = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
    const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_14_BLACK);

    // Left Side: Person Image Circle
    if (personImageUrl) {
      const personResp = await axios.get(personImageUrl, { responseType: 'arraybuffer' });
      const person = await Jimp.read(Buffer.from(personResp.data));
      person.circle().resize(120, 120);
      footer.composite(person, 30, 40);
    }

    // Center Text Info Block
    const textX = 170;
    let textY = 40;
    footer.print(fontBig, textX, textY, name);
    textY += 40;
    footer.print(fontMed, textX, textY, title);
    textY += 30;
    footer.print(fontSmall, textX, textY, phone);
    textY += 20;
    footer.print(fontSmall, textX, textY, email);
    textY += 20;
    footer.print(fontSmall, textX, textY, website);
    textY += 20;
    footer.print(fontSmall, textX, textY, address);

    // Right Side: Logo
    if (logoUrl) {
      const logoResp = await axios.get(logoUrl, { responseType: 'arraybuffer' });
      const logo = await Jimp.read(Buffer.from(logoResp.data));
      logo.contain(100, 100);
      footer.composite(logo, width - 130, 50);
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

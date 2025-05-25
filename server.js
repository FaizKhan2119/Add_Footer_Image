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
    const { name, title, phone, email, website, address, logoUrl, personImageUrl } = req.body;
    const imageBuffer = req.file?.buffer;
    if (!imageBuffer) return res.status(400).json({ error: 'Image is required' });

    const mainImage = await Jimp.read(imageBuffer);
    const width = mainImage.bitmap.width;
    const footerHeight = 200;
    const footer = new Jimp(width, footerHeight, '#C5EDF9');

    // Draw circular dark shapes on left and right
    const darkCircle = new Jimp(width, footerHeight, 0x064965FF);
    darkCircle.circle();
    footer.composite(darkCircle.clone().crop(0, 0, 300, footerHeight), -100, 0);
    footer.composite(darkCircle.clone().crop(width - 250, 0, 300, footerHeight), width - 150, 0);

    // Fonts
    const fontBig = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const fontMed = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);

    // Text
    footer.print(fontBig, 220, 20, name);
    footer.print(fontMed, 220, 60, title);
    footer.print(fontMed, 220, 90, phone);
    footer.print(fontMed, 220, 110, email);
    footer.print(fontMed, 220, 130, website);
    footer.print(fontMed, 220, 150, address);

    // Person Image
    if (personImageUrl) {
      const personResp = await axios.get(personImageUrl, { responseType: 'arraybuffer' });
      const person = await Jimp.read(Buffer.from(personResp.data));
      person.circle().resize(120, 120);
      mainImage.composite(person, 40, mainImage.bitmap.height - 60); // overlaps half in image
    }

    // Logo on right
    if (logoUrl) {
      const logoResp = await axios.get(logoUrl, { responseType: 'arraybuffer' });
      const logo = await Jimp.read(Buffer.from(logoResp.data));
      logo.contain(80, 80);
      footer.composite(logo, width - 120, 50);
    }

    // Combine
    const finalImage = new Jimp(width, mainImage.bitmap.height + footerHeight);
    finalImage.composite(mainImage, 0, 0);
    finalImage.composite(footer, 0, mainImage.bitmap.height);

    const buffer = await finalImage.getBufferAsync(Jimp.MIME_JPEG);
    res.set('Content-Type', 'image/jpeg');
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

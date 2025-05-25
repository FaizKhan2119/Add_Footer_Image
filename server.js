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

    // Fonts
    const fontBig = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
    const fontMed = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

    // Left Side: Person Image Circle (larger and more centered)
    if (personImageUrl) {
      const personResp = await axios.get(personImageUrl, { responseType: 'arraybuffer' });
      const person = await Jimp.read(Buffer.from(personResp.data));
      person.circle().resize(180, 180);
      footer.composite(person, 100, 35);
    }

    // Text: Center-aligned block but with left-indent
    const textBlockWidth = 600;
    const textX = (width - textBlockWidth) / 2;
    let textY = 40;

    footer.print(fontBig, textX, textY, { text: name, alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT });
    textY += 70;
    footer.print(fontMed, textX, textY, { text: title, alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT });
    textY += 50;
    footer.print(fontSmall, textX, textY, { text: phone, alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT });
    textY += 40;
    footer.print(fontSmall, textX, textY, { text: email, alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT });
    textY += 40;
    footer.print(fontSmall, textX, textY, { text: website, alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT });
    textY += 40;
    footer.print(fontSmall, textX, textY, { text: address, alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT });

    // Right Side: Logo (more centered vertically)
    if (logoUrl) {
      const logoResp = await axios.get(logoUrl, { responseType: 'arraybuffer' });
      const logo = await Jimp.read(Buffer.from(logoResp.data));
      logo.contain(100, 100);
      footer.composite(logo, width - 160, 75);
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

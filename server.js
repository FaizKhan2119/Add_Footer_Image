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
    const footerHeight = 340;
    const footer = new Jimp(width, footerHeight, '#DFF2F8');

    // Load fonts using require.resolve to avoid Render error
    const fontBig = await Jimp.loadFont(require.resolve('jimp/fonts/open-sans/open-sans-64-black.fnt'));
    const fontMed = await Jimp.loadFont(require.resolve('jimp/fonts/open-sans/open-sans-48-black.fnt'));
    const fontSmall = await Jimp.loadFont(require.resolve('jimp/fonts/open-sans/open-sans-32-black.fnt'));

    // Left Side: Person Image Circle (larger and more centered)
    const personSize = 160;
    const personX = 40;
    const personY = (footerHeight - personSize) / 2;

    if (personImageUrl) {
      const personResp = await axios.get(personImageUrl, { responseType: 'arraybuffer' });
      const person = await Jimp.read(Buffer.from(personResp.data));
      person.circle().resize(personSize, personSize);
      footer.composite(person, personX, personY);
    }

    // Right Side: Logo (center aligned vertically and moved slightly left)
    const logoSize = 100;
    const logoX = width - logoSize - 60;
    const logoY = (footerHeight - logoSize) / 2;

    if (logoUrl) {
      const logoResp = await axios.get(logoUrl, { responseType: 'arraybuffer' });
      const logo = await Jimp.read(Buffer.from(logoResp.data));
      logo.contain(logoSize, logoSize);
      footer.composite(logo, logoX, logoY);
    }

    // Text: Move more to center and leave margin from both images
    const marginLeft = personX + personSize + 50;
    const marginRight = logoSize + 80;
    const textBlockWidth = width - marginLeft - marginRight;
    const textX = marginLeft;
    let textY = 40;

    footer.print(fontBig, textX, textY, {
      text: name,
      alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, textBlockWidth);
    textY += 70;

    footer.print(fontMed, textX, textY, {
      text: title,
      alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT
    }, textBlockWidth);
    textY += 55;

    footer.print(fontSmall, textX, textY, {
      text: phone,
      alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT
    }, textBlockWidth);
    textY += 40;

    footer.print(fontSmall, textX, textY, {
      text: website,
      alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT
    }, textBlockWidth);

    // Bottom Row: Email and Address Side-by-Side, placed horizontally at bottom
    const bottomY = footerHeight - 60;
    const halfBlock = (textBlockWidth - 20) / 2;

    footer.print(fontSmall, textX, bottomY, {
      text: email,
      alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT
    }, halfBlock);

    footer.print(fontSmall, textX + halfBlock + 20, bottomY, {
      text: address,
      alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT
    }, halfBlock);

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

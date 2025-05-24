const express = require('express');
const Jimp = require('jimp');
const multer = require('multer');
const cors = require('cors');

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

app.post('/add-footer', upload.single('image'), async (req, res) => {
  try {
    const { name, contact, email, address } = req.body;

    const image = await Jimp.read(req.file.buffer);
    const footerHeight = 120;
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    const footer = new Jimp(width, footerHeight, '#ffffff');
    const footerText = `
Name: ${name || 'N/A'}
Contact: ${contact || 'N/A'}
Email: ${email || 'N/A'}
Address: ${address || 'N/A'}
    `;

    const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
    footer.print(font, 10, 10, footerText);

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

// ✅ Use Render's PORT env variable
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

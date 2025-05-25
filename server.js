const express = require('express');
const Jimp = require('jimp');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
const upload = multer({ storage: multer.memoryStorage() });

app.post('/stitch-images', upload.single('image'), async (req, res) => {
  try {
    const { footerImageUrl } = req.body;

    // 🧩 Step 1: Validate inputs
    const imageBuffer = req.file?.buffer;
    if (!imageBuffer) return res.status(400).json({ error: 'Main image is required' });
    if (!footerImageUrl) return res.status(400).json({ error: 'Footer image URL is required' });

    // 🧩 Step 2: Read both images
    const mainImage = await Jimp.read(imageBuffer);
    const footerResp = await axios.get(footerImageUrl, { responseType: 'arraybuffer' });
    const footerImage = await Jimp.read(Buffer.from(footerResp.data));

    // 🧩 Step 3: Resize footer to match main image width
    if (footerImage.bitmap.width !== mainImage.bitmap.width) {
      footerImage.resize(mainImage.bitmap.width, Jimp.AUTO);
    }

    // 🧩 Step 4: Create new image and stitch vertically
    const finalImage = new Jimp(
      mainImage.bitmap.width,
      mainImage.bitmap.height + footerImage.bitmap.height
    );

    finalImage.composite(mainImage, 0, 0);
    finalImage.composite(footerImage, 0, mainImage.bitmap.height);

    // 🧩 Step 5: Send stitched image as binary
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

const Jimp = require('jimp');
const QrCode = require('qrcode-reader');

exports.readQR = async (filePath) => {
  const image = await Jimp.read(filePath);
  const qr = new QrCode();

  return new Promise((resolve, reject) => {
    qr.callback = (err, value) => {
      if (err || !value) reject('QR decode failed');
      else resolve(value.result);
    };
    qr.decode(image.bitmap);
  });
};

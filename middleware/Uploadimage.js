const { S3 } = require("@aws-sdk/client-s3");
require("dotenv").config();
const multerS3 = require("multer-s3");
const multer = require("multer");

const AccessKeyId = process.env.accessKeyId;
const SecretAccessKey = process.env.secretAccessKey;
const bucket = process.env.bucketname;
// Configure AWS SDK
const awsS3 = new S3({
  region: "ap-south-1",
  credentials: {
    accessKeyId: AccessKeyId,
    secretAccessKey: SecretAccessKey,
  },
});

// Multer S3 configuration
const upload = multer({
  storage: multerS3({
    s3: awsS3,
    bucket: bucket,
    // acl: 'public-read',
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + "-" + file.originalname);
    },
  }),

  // limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { upload };

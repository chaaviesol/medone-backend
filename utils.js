const crypto = require("crypto");
require("dotenv").config();
const winston = require("winston");
const fs = require("fs");
const algorithm = "aes-256-cbc";
const secretKey = process.env.ENCRYPTION_KEY; // Ensure this is a 64-character hexadecimal string
const iv = process.env.IV; // Ensure this is a 32-character hexadecimal string
const currentDate = new Date();
const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
const istDate = new Date(currentDate.getTime() + istOffset);
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
if (!secretKey || secretKey.length !== 64) {
  throw new Error(
    "Invalid ENCRYPTION_KEY. Must be a 64-character hexadecimal string."
  );
}

if (!iv || iv.length !== 32) {
  throw new Error("Invalid IV. Must be a 32-character hexadecimal string.");
}

// Function to encrypt data
function encrypt(text) {
  if (typeof text !== "string") {
    throw new TypeError("The text to be encrypted must be a string");
  }
  const ivBuffer = Buffer.from(iv, "hex"); // Use IV from environment variable
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(secretKey, "hex"),
    ivBuffer
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const encryptedText = ivBuffer.toString("hex") + ":" + encrypted;
  console.log("Encrypted text:", encryptedText);
  return encryptedText;
}

// Function to decrypt data
function decrypt(text) {
  // console.log("Decrypting text:", text);
  const textParts = text.split(":");
  if (textParts.length !== 2) {
    // console.error("Invalid encrypted text format:", text); // Error log
    throw new Error("Invalid encrypted text format");
  }
  const ivBuffer = Buffer.from(textParts[0], "hex");
  const encryptedText = Buffer.from(textParts[1], "hex");
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(secretKey, "hex"),
    ivBuffer
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function getCurrentDateInIST() {
  const currentDate = new Date();
  const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
  const istDate = new Date(currentDate.getTime() + istOffset);
  return istDate;
}


//Configure the Winston logger
const logDirectory = "./logs";
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: `${logDirectory}/error.log`,
      level: "error",
    }),
    new winston.transports.File({ filename: `${logDirectory}/combined.log` }),
  ],
});

module.exports = { encrypt, decrypt,getCurrentDateInIST, istDate, logger, prisma };

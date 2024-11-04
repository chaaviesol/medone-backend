const admin = require('firebase-admin')
const serviceAccount = require('../medone-backend/firebase-adminsdk.json')
require("dotenv").config();



admin.initializeApp({
    credential:admin.credential.cert(serviceAccount),
    databaseURL:process.env.DATABASE_URL 
})


module.exports = admin
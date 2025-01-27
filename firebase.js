const admin = require('firebase-admin')
///git//
const serviceAccount = require('../med-one/firebase-adminsdk.json')
//local///////////////
// const serviceAccount = require('../medone-backend/firebase-adminsdk.json')
require("dotenv").config();



admin.initializeApp({
    credential:admin.credential.cert(serviceAccount),
    databaseURL:process.env.DATABASE_URL 
})


module.exports = admin
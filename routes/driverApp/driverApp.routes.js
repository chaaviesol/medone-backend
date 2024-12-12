const express = require("express")
const {driver_login,
    getDriver_profile,
    getorder
} = require('./driverApp.controller')
const driverRouter = express.Router()



driverRouter.post('/driver_login',driver_login)
driverRouter.post('/getDriver_profile',getDriver_profile)
driverRouter.post('/getorder',getorder)















module.exports = driverRouter
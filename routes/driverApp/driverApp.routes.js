const express = require("express")
const {driver_login,
    getDriver_profile,
    getorder,
    pickUp_status,
    accepted_trips,
    verifyTrips,
    addDeliveryStatus,
    get_fulfilledOrders,
    wallet
} = require('./driverApp.controller')
const driverRouter = express.Router()



driverRouter.post('/driver_login',driver_login)
driverRouter.post('/getDriver_profile',getDriver_profile)
driverRouter.post('/getorder',getorder)
driverRouter.post('/pickUp_status',pickUp_status)
driverRouter.post('/accepted_trips',accepted_trips)
driverRouter.post('/verifyTrips',verifyTrips)
driverRouter.post('/addDeliveryStatus',addDeliveryStatus)
driverRouter.post('/get_fulfilledOrders',get_fulfilledOrders)
driverRouter.post('/wallet',wallet)











module.exports = driverRouter
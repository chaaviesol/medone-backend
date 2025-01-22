const express = require("express")
const {driver_login,
    getDriver_profile,
    getorder,
    pickUp_status,
    accepted_trips,
    verifyTrips,
    addDeliveryStatus,
    get_fulfilledOrders,
    wallet,
    get_prescription,
    prescriptionStatus,
    add_stampStatus,
    changePassword,
    forgot_password,
    addPayment_method,
    payment_creditedStatus
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
driverRouter.post('/get_prescription',get_prescription)
driverRouter.post('/prescriptionStatus',prescriptionStatus)  /// if status is reject notification is required
driverRouter.post('/add_stampStatus',add_stampStatus)
driverRouter.post('/changePassword',changePassword)
driverRouter.post('/forgot_password',forgot_password)
driverRouter.post('/addPayment_method',addPayment_method)
driverRouter.post('/payment_creditedStatus',payment_creditedStatus)




module.exports = driverRouter
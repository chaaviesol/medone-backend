const express = require("express")
const {chemist_login,
    addChemist,
    chemist_profile,
    getOrder,
    orderResponse,
    getConfirmedOrder,
    getproductspharmacy,
    assignpharmacy,
    addTokenPh,
    changePassword,
    forgot_password,
    get_notification,
    addSeenStatus,
    orderSummery,
    verifyOtp,
    trackOrder
} = require('./chemist.controller')

const chemistRouter = express.Router()



chemistRouter.post('/chemist_login',chemist_login)
chemistRouter.post('/addChemist',addChemist)
chemistRouter.post('/chemist_profile',chemist_profile)
chemistRouter.post('/getorder',getOrder)
chemistRouter.post('/orderResponse',orderResponse)
chemistRouter.post('/getconfirmedorder',getConfirmedOrder)
chemistRouter.post('/getproductspharmacy',getproductspharmacy)
chemistRouter.post('/assignpharmacy',assignpharmacy)
chemistRouter.post('/addTokenPh',addTokenPh)
chemistRouter.post('/changePassword',changePassword)
chemistRouter.post('/forgot_password',forgot_password)
chemistRouter.post('/get_notification',get_notification)
chemistRouter.post('/addSeenStatus',addSeenStatus)
chemistRouter.post('/orderSummery',orderSummery)
chemistRouter.post('/verifyOtp',verifyOtp)
chemistRouter.post('/trackOrder',trackOrder)






module.exports = chemistRouter
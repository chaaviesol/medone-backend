const express = require("express")
const {labpartner_login,
    labpartner_profile,
    getOrder,
    orderResponse,
    edit_profile,
    pastOrder
} = require('./labpartner.controller')

const labpartnerRouter = express.Router()


labpartnerRouter.post('/labpartner_login',labpartner_login)
labpartnerRouter.post('/labpartner_profile',labpartner_profile)
labpartnerRouter.post('/getOrder',getOrder)
labpartnerRouter.post('/orderResponse',orderResponse)
labpartnerRouter.post('/edit_profile',edit_profile)
labpartnerRouter.post('/pastOrder',pastOrder)



module.exports = labpartnerRouter
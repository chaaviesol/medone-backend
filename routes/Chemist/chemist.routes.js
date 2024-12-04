const express = require("express")
const {chemist_login,addChemist,
    chemist_profile,
    getOrder,
    orderResponse,
    getConfirmedOrder
} = require('./chemist.controller')

const chemistRouter = express.Router()



chemistRouter.post('/chemist_login',chemist_login)
chemistRouter.post('/addChemist',addChemist)
chemistRouter.post('/chemist_profile',chemist_profile)
chemistRouter.post('/getorder',getOrder)
chemistRouter.post('/orderResponse',orderResponse)
chemistRouter.post('/getconfirmedorder',getConfirmedOrder)















module.exports = chemistRouter
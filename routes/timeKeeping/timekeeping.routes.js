const express = require("express")
const {assist_login,
    getAssist_profile,
    getTask
} = require('./timekeeping.controller')
const timekeepingRouter = express.Router()


timekeepingRouter.post('/assist_login',assist_login)
timekeepingRouter.post('/getAssist_profile',getAssist_profile)
timekeepingRouter.post('/getTask',getTask)










module.exports = timekeepingRouter
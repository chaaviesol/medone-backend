const express = require("express")
const {assist_login,
    getAssist_profile,
    getTask,
    applyLeave_assist,
    assist_checkin,
    assist_checkout,
    assistWorkingHours
} = require('./timekeeping.controller')
const timekeepingRouter = express.Router()


timekeepingRouter.post('/assist_login',assist_login)
timekeepingRouter.post('/getAssist_profile',getAssist_profile)
timekeepingRouter.post('/getTask',getTask)
timekeepingRouter.post('/applyLeave_assist',applyLeave_assist)
timekeepingRouter.post('/assist_checkin',assist_checkin)
timekeepingRouter.post('/assist_checkout',assist_checkout)
timekeepingRouter.post('/assistWorkingHours',assistWorkingHours)






module.exports = timekeepingRouter
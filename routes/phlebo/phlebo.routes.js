const express = require('express')
const {phlebo_login,
    get_worklist,
    phlebo_checkin,
    add_barcode,
    submit_task
} = require('./phlebo.controller')
const phleboRouter = express.Router()


phleboRouter.post('/phlebo_login',phlebo_login)
phleboRouter.post('/get_worklist',get_worklist)
phleboRouter.post('/phlebo_checkin',phlebo_checkin)
phleboRouter.post('/add_barcode',add_barcode)
phleboRouter.post('/submit_task',submit_task)














module.exports = phleboRouter
















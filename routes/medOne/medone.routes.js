const express = require ("express")
const {addUserData,
    userLogin,
    addRoutine,
    getUserRoutine,
    getMedicine,
    addNewMedicine,
    addMedicineSchedule,
   
    notifyMedicineSchedule,
    userProfile,
    editRoutine,
    editMedicineSchedule,
    getUserSchedule,
    addStatus,
    getMedicationHistory,
    refillNotification
} = require('./medone.controller')
const medoneRouter = express.Router();
const auth = require("../../middleware/Auth/auth");




medoneRouter.post('/addUserData',addUserData)
medoneRouter.post('/userLogin',userLogin)
medoneRouter.post('/addRoutine',addRoutine)
medoneRouter.post('/getUserRoutine',getUserRoutine)
medoneRouter.get('/getmedicine',getMedicine)
medoneRouter.post('/addnewmedicine',addNewMedicine)
medoneRouter.post('/addMedicineSchedule',addMedicineSchedule)
// medoneRouter.post('/homepage',homePageCard) //not completed
medoneRouter.post('/notifymedicineschedule',notifyMedicineSchedule) // not completed
medoneRouter.post('/userprofile',userProfile)
medoneRouter.post('/editroutine',editRoutine)
medoneRouter.post('/editschedule',editMedicineSchedule)
medoneRouter.post('/getuserschedule',getUserSchedule)
medoneRouter.post('/addStatus',addStatus)
medoneRouter.post('/medicationhistory',getMedicationHistory)
medoneRouter.post('/refillnotification',refillNotification)












module.exports = medoneRouter
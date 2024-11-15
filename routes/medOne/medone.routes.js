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
    refillNotification,
    realTimeNotification,
    getNotification,
    addSeenStatus,
    editUserProfile,
    addToken,
    updatedchat,
    // notificationData
} = require('./medone.controller')
const medoneRouter = express.Router();
const auth = require("../../middleware/Auth/auth");
const { upload } = require("../../middleware/Uploadimage");



medoneRouter.post('/addUserData',upload.single("image"),addUserData)
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
medoneRouter.post('/realtimenotification',realTimeNotification)
medoneRouter.post('/getnotification',getNotification)
medoneRouter.post('/addSeenStatus',addSeenStatus) 
medoneRouter.post('/edituserprofile',editUserProfile)
medoneRouter.post('/addToken',addToken)
medoneRouter.post('/updatedchat',updatedchat)
// medoneRouter.post('/notificationData',notificationData)




module.exports = medoneRouter
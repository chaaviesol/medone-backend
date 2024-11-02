// var admin = require("firebase-admin")
// // var fcm = require("fcm-notification")






// var serviceAccount = require("../controllers/push-notification.controller.js")
// const certPath = admin.credential.cert(serviceAccount)
// // var FCM =new fcm(certPath)



// exports.sendPushNotification = (req,res,next)=>{
//     try{
//         let message ={
//             notification:{
//                 title:"Test Notification",
//                 body:"Notification Message"
//             },
//             data:{
//                 orderId:123456,
//                 orderDate:"2024-11-02"
//             },
//             token:req.body.fcm_token
          
//         }
//         FCM.send(message, function(err,resp){
//             if(err){
//                return res.status(400).json({
//                     message:err
//                })
//             }else{
//                return res.status(200).json({
//                 message:"Notification send"
//                })
//             }
//         })

//     }catch(err){
//         throw err;
//     }
// }
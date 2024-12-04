const express = require("express");
require("dotenv").config();
const cron = require("node-cron")
const bodyParser = require("body-parser");
const PORT = process.env.PORT;
const HOST = process.env.HOST;
const server = express();
const cors = require("cors");
const admin = require('./firebase')
const authRouter = require("./routes/Auth/authRouters");
const HospitalRouter = require("./routes/hospital/hospital.routes");
const UserRouter = require("./routes/user/user.routes");
const PharmacyRouter = require("./routes/pharmacy/pharmacy.routes");
const medoneRouter = require("./routes/medOne/medone.routes");
const productRouter = require("./routes/productcategory/productcategory.routes");
const { PrismaClient } = require("@prisma/client");
const pharmacyquotationRouter = require("./routes/pharmacyquotation/pharmacyquotation.routes");
const { checkPrime } = require("crypto");
const chemistRouter = require("./routes/Chemist/chemist.routes");
const prisma = new PrismaClient();


server.use(
  cors({
    origin: "*",
    allowedHeaders: "X-Requested-With,Content-Type,auth-token,Authorization",
    credentials: true,
  })
);
server.use(bodyParser.json());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

server.use("/auth", authRouter);
server.use("/hospital", HospitalRouter);
server.use("/user", UserRouter);
server.use("/medone",medoneRouter)
server.use("/pharmacy", PharmacyRouter);
server.use("/product", productRouter);
server.use("/pharmacyquotation",pharmacyquotationRouter)
server.use("/chemist",chemistRouter)

if (process.env.NODE_ENV === "development") {
  server.listen(PORT, () => {
    console.log(`server started at ${HOST}:${PORT}`);
  });
}













// const sendNotification = async (token, title, message) => {
//   const messagePayload = {
//     token: token,
//     notification: {
//       title: title,
//       body: message
//     },
//     android: {
//       priority: "high"
//     },
//     apns: {  //apple push notification service
//       payload: {
//         aps: {
//           contentAvailable: true
//         }
//       }
//     },
//     // time_to_live: 120,  // TTL in seconds (1 hour)
//   };


// };

// const scheduleNotificationForUser = async (userId) => {
//   try {
//     const user = await prisma.user_details.findUnique({
//       where: {
//         id: userId
//       }
//     });

//     if (!user) {
//       console.log("User not found");
//       return "User not found";
//     }

//     const getNotification = await prisma.notification.findMany({
//       where: {
//         user_id: userId
//       }
//     });

//     for (let notification of getNotification) {
//       const message = notification.message;
//       console.log("Sending notification with message:", message);

//       // Send the notification
//       const notificationResponse = await sendNotification(user.token, "Reminder", message);
//       console.log(notificationResponse);
//     }

//     return "Notifications scheduled successfully!";
//   } catch (error) {
//     console.error("Error in scheduleNotificationForUser:", error);
//     return "Error scheduling notifications";
//   }
// };

// server.post('/send-notification', async (req, res) => {
//   const { userId } = req.body;

//   try {
//     const findnotification =  await prisma.notification.update({
//       where:{
//         user_id:userId,
//         view_status:"false"
//       },
//       data:{
//         view_status:"true"
//       }
//     })
//     console.log({findnotification})
//     const getNotification = await prisma.notification.findMany({
//       where: {
//         user_id: userId,
//          status:"Not seen",
//          view_status:"true"
//       },
     
     
//     });
//     console.log({ getNotification });

//     const notificationMessage = await scheduleNotificationForUser(userId);

//     res.status(200).json({
//       error: false,
//       success: true,
//       message: notificationMessage,
//       data: getNotification
//     });
//   } catch (error) {
//     console.error("Error in /send-notification:", error);
//     res.status(500).json({
//       error: true,
//       message: "Failed to send notification"
//     });
//   }
// });

// server.post('/send-notification', async (req, res) => {
//   const { userId } = req.body;

//   try {
//     // Step 1: Update all notifications with `view_status: false` to `view_status: true`
//     // const updatedNotifications = await prisma.notification.updateMany({
//     //   where: {
//     //     user_id: userId,
//     //     view_status: "false", // Only update notifications with `view_status: false`
//     //   },
//     //   data: {
//     //     view_status: "true",
//     //   },
//     // });

//     // Log how many notifications were updated
//     // console.log(`Updated ${updatedNotifications.count} notifications for user ${userId}.`);

//     // Step 2: Retrieve all notifications with `view_status: true` but ensure they haven't been "seen"
//     const getNotification = await prisma.notification.findMany({
//       where: {
//         user_id: userId,
//         status: "Not seen", // Ensure only unseen notifications are fetched
//         // view_status: "false",
//       },
//     });

//     // Log the notifications retrieved
//     console.log({ getNotification });

//     // Step 3: Call the function to schedule notifications for the user
//     const notificationMessage = await scheduleNotificationForUser(userId);
    
//    if(getNotification){
//     try {
//       const response = await admin.messaging().send(messagePayload);
//       console.log("Successfully sent the notification ----->", response);
//       return "Notification sent successfully!";
//     } catch (error) {
//       console.error("Error sending notification ----->", error);
//       return `Failed to send notification: ${error.message}`;
//     }
//    }
//     res.status(200).json({
//       error: false,
//       success: true,
//       message: notificationMessage,
//       data: getNotification,
//     });

//   } catch (error) {
//     console.error("Error in /send-notification:", error);
//     res.status(500).json({
//       error: true,
//       message: "Failed to send notification",
//     });
//   }
// });







/////////////workinggggg///////////////////////
server.post('/send-notification', async (req, res) => {
  const { userId, fcmToken } = req.body;

  try {
    // Retrieve notifications with `status: "Not seen"`
    const getNotification = await prisma.notification.findMany({
      where: {
        user_id: userId,
        status: "Not seen",
      },
    });
    // console.log({ getNotification });
    if(getNotification.length<1){
      return res.status(404).json({
        error: true,
        success: false,
        message: "No unseen notifications available",
      });
    }
    // if (getNotification.length > 0) {
      const sentNotifications = []; // Array to store details of sent notifications

      for (const notification of getNotification) {
        // if (!fcmToken) {
        //   console.error(`Missing token for notification ID: ${notification.id}`);
        //   continue;
        // }

        try {
          const response = await sendNotification(fcmToken, notification.title, notification.message);
          console.log("Successfully sent the notification ----->", response);
          
          // Update the notification status to "Sent"
          await prisma.notification.update({
            where: { id: notification.id },
            data: { status: "Sent", view_status: "true" },
          });

          // Add sent notification details to the response
          sentNotifications.push({
            id: notification.id,
            title: notification.title,
            message: notification.message,
            status: "Sent",
            response,
          });
          
        } catch (error) {
          console.error(`Error sending notification for ID ${notification.id} ----->`, error);
          continue;
        }
      }

      return res.status(200).json({
        error: false,
        success: true,
        message: "Notifications processed successfully",
        data: sentNotifications, // Include sent notification details
      });
    // } else {
      // return res.status(404).json({
      //   error: true,
      //   success: false,
      //   message: "No unseen notifications available",
      // });
    // }
  } catch (error) {
    console.error("Error in /send-notification:", error);
    return res.status(500).json({
      error: true,
      message: "Failed to process notifications",
    });
  }
});

// Define the sendNotification function
const sendNotification = async (token, title, message) => {
  console.log("notification sended")
  const messagePayload = {
    token: token, // Ensure token is passed correctly
    notification: {
      title: title || "Default Title",
      body: message || "Default Message",
    },
    android: {
      priority: "high",
    },
    apns: {
      payload: {
        aps: {
          contentAvailable: true,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(messagePayload);
    return `Notification sent successfully! Response: ${response}`;
  } catch (error) {
    throw new Error(`Failed to send notification: ${error.message}`);
  }
};

   


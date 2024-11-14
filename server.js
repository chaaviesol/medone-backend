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
const medoneRouter = require("./routes/medOne/medone.routes");
const { PrismaClient } = require("@prisma/client");
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


if (process.env.NODE_ENV === "development") {
  server.listen(PORT, () => {
    console.log(`server started at ${HOST}:${PORT}`);
  });
}













const sendNotification = async (token, title, message) => {
  const messagePayload = {
    token: token,
    notification: {
      title: title,
      body: message
    },
    android: {
      priority: "high"
    },
    apns: {  //apple push notification service
      payload: {
        aps: {
          contentAvailable: true
        }
      }
    }
  };

  try {
    const response = await admin.messaging().send(messagePayload);
    console.log("Successfully sent the notification ----->", response);
    return "Notification sent successfully!";
  } catch (error) {
    console.error("Error sending notification ----->", error);
    return `Failed to send notification: ${error.message}`;
  }
};

const scheduleNotificationForUser = async (userId) => {
  try {
    const user = await prisma.user_details.findUnique({
      where: {
        id: userId
      }
    });

    if (!user) {
      console.log("User not found");
      return "User not found";
    }

    const getNotification = await prisma.notification.findMany({
      where: {
        user_id: userId
      }
    });

    for (let notification of getNotification) {
      const message = notification.message;
      console.log("Sending notification with message:", message);

      // Send the notification
      const notificationResponse = await sendNotification(user.token, "Reminder", message);
      console.log(notificationResponse);
    }

    return "Notifications scheduled successfully!";
  } catch (error) {
    console.error("Error in scheduleNotificationForUser:", error);
    return "Error scheduling notifications";
  }
};

server.post('/send-notification', async (req, res) => {
  const { userId } = req.body;

  try {
    const getNotification = await prisma.notification.findMany({
      where: {
        user_id: userId
      }
    });
    console.log({ getNotification });

    const notificationMessage = await scheduleNotificationForUser(userId);

    res.status(200).json({
      error: false,
      success: true,
      message: notificationMessage,
      data: getNotification
    });
  } catch (error) {
    console.error("Error in /send-notification:", error);
    res.status(500).json({
      error: true,
      message: "Failed to send notification"
    });
  }
});



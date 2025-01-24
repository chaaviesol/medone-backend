const express = require("express");
require("dotenv").config();
const cron = require("node-cron");
const bodyParser = require("body-parser");
const PORT = process.env.PORT;
const HOST = process.env.HOST;
const server = express();
const cors = require("cors");
const admin = require("./firebase");
const authRouter = require("./routes/Auth/authRouters");
const HospitalRouter = require("./routes/hospital/hospital.routes");
const UserRouter = require("./routes/user/user.routes");
const PharmacyRouter = require("./routes/pharmacy/pharmacy.routes");
const medoneRouter = require("./routes/medOne/medone.routes");
const productRouter = require("./routes/productcategory/productcategory.routes");
const googleMapRouter = require("./routes/googleMap/googlemap.routes");
const { PrismaClient } = require("@prisma/client");
const pharmacyquotationRouter = require("./routes/pharmacyquotation/pharmacyquotation.routes");
const { checkPrime } = require("crypto");
const chemistRouter = require("./routes/Chemist/chemist.routes");
const prisma = new PrismaClient();

//for zoom meeting////
const axios = require("axios");
const driverRouter = require("./routes/driverApp/driverApp.routes");
const LabtestRouter = require("./routes/labtest/labtest.routes");
const servicesRouter = require("./routes/services/services.routes");

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
server.use("/medone", medoneRouter);
server.use("/pharmacy", PharmacyRouter);
server.use("/product", productRouter);
server.use("/pharmacyquotation", pharmacyquotationRouter);
server.use("/chemist", chemistRouter);
server.use("/googlemap", googleMapRouter);
server.use("/driver", driverRouter);
server.use("/labtest", LabtestRouter);
server.use("/services", servicesRouter);

if (process.env.NODE_ENV === "development") {
  server.listen(PORT, () => {
    console.log(`server started at ${HOST}:${PORT}`);
  });
}

/////////////workinggggg///////////////////////
server.post("/send-notification", async (req, res) => {
  const { userId, fcmToken } = req.body;

  try {
    // Retrieve notifications with `status: "Not seen"`
    const getNotification = await prisma.notification.findMany({
      where: {
        user_id: userId,
        status: "Not seen",
      },
    });

    if (getNotification.length < 1) {
      return res.status(404).json({
        error: true,
        success: false,
        message: "No unseen notifications available",
      });
    }

    const sentNotifications = []; // Array to store details of sent notifications
    const currentDateTime = new Date();
    const currentDate = currentDateTime.toISOString().split("T")[0]; // Extract current date in YYYY-MM-DD format
    const currentTime = currentDateTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }); // Extract current time in HH:mm AM/PM format

    for (const notification of getNotification) {
      const notificationDate = new Date(notification.created_date)
        .toISOString()
        .split("T")[0]; // Extract notification date
      const notificationTime = new Date(
        notification.notificationTime
      ).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }); // Extract notification time

      // Check if current date and time match notification's date and time
      if (
        currentDate === notificationDate &&
        currentTime === notificationTime
      ) {
        try {
          const response = await sendNotification(
            fcmToken,
            notification.title,
            notification.message
          );
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
          console.error(
            `Error sending notification for ID ${notification.id} ----->`,
            error
          );
          continue;
        }
      } else {
        console.log(
          `Notification ID ${notification.id} is not scheduled for this date and time: ${currentDate}, ${currentTime}`
        );
      }
    }

    return res.status(200).json({
      error: false,
      success: true,
      message: "Notifications processed successfully",
      data: sentNotifications, // Include sent notification details
    });
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
  console.log("notification sended");
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

///////for zoom////////

// const CLIENT_ID = '';
// const CLIENT_SECRET = '';

// // Function to generate access token
// const getAccessToken = async () => {
//   const tokenUrl = 'https://zoom.us/oauth/token';
//   const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

//   try {
//     const response = await axios.post(
//       tokenUrl,
//       new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
//       {
//         headers: {
//           Authorization: `Basic ${authHeader}`,
//           'Content-Type': 'application/x-www-form-urlencoded',
//         },
//       }
//     );
//     return response.data.access_token;
//   } catch (error) {
//     console.error('Error fetching access token:', error.response.data);
//     throw new Error('Failed to generate access token');
//   }
// };

// // Function to create a Zoom meeting
// const createZoomMeeting = async (accessToken) => {
//   const url = 'https://api.zoom.us/v2/users/me/meetings';
//   const meetingDetails = {
//     topic: 'Meeting with User',
//     type: 2, // Scheduled meeting
//     start_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
//     duration: 30, // 30 minutes
//     timezone: 'UTC',
//     settings: {
//       host_video: true,
//       participant_video: true,
//     },
//   };

//   try {
//     const response = await axios.post(url, meetingDetails, {
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//         'Content-Type': 'application/json',
//       },
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error creating Zoom meeting:', error.response.data);
//     throw new Error('Failed to create meeting');
//   }
// };

// // Route to create and return a meeting link
// server.post('/createMeeting', async (req, res) => {
//   try {
//     const accessToken = await getAccessToken();
//     const meetingData = await createZoomMeeting(accessToken);
//     res.json({
//       message: 'Meeting created successfully',
//       join_url: meetingData.join_url,
//       start_url: meetingData.start_url,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// const CLIENT_ID = 'sBjEpNMUQO6iFNijmKM8hw';
// const CLIENT_SECRET = 'TOo0N689dC2Y5zXw4QKtGdMWWRbf8tgl';

// const getAccessToken = async () => {
//   const tokenUrl = 'https://zoom.us/oauth/token';
//   const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

//   try {
//     const response = await axios.post(
//       tokenUrl,
//       new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
//       {
//         headers: {
//           Authorization: `Basic ${authHeader}`,
//           'Content-Type': 'application/x-www-form-urlencoded',
//         },
//       }
//     );
//     return response.data.access_token;  // Access token generated here
//   } catch (error) {
//     console.error('Error fetching access token:', error.response.data);
//     throw new Error('Failed to generate access token');
//   }
// };
// const createZoomMeeting = async (accessToken) => {
//   const url = 'https://api.zoom.us/v2/users/me/meetings';
//   const meetingDetails = {
//     topic: 'Meeting with User',
//     type: 2, // Scheduled meeting
//     start_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
//     duration: 30, // 30 minutes
//     timezone: 'UTC',
//     settings: {
//       host_video: true,
//       participant_video: true,
//     },
//   };

//   try {
//     const response = await axios.post(url, meetingDetails, {
//       headers: {
//         Authorization: `Bearer ${accessToken}`,  // Use access token here
//         'Content-Type': 'application/json',
//       },
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error creating Zoom meeting:', error.response.data);
//     throw new Error('Failed to create meeting');
//   }
// };

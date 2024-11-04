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


const sendNotification =(token,  title, message)=>{
  const payload ={
    notification:{
      title:title,
      body:message
    } 
  }

  admin.messaging().sendToDevice(token, payload)
.then(response =>{
  console.log("Successfully sended the notification----->",response)
  }).catch(error =>{
    console.log("Error sending notification----->",error)
  })
}   

  const timeToCron = (time) => {
    const [hours, minutes] = time.split(':');
    return `${minutes} ${hours} * * *`;
  };

  const scheduleNotificationForUser = async(userId)=>{
    try{
      const user = await prisma.user_details.findMany({
        where:{
          id:userId
        }
      })
      if(!user){
        console.log("user not found")
        return
      }
      const notificationTime = user.notificationTime; 
      const cronTime = timeToCron(notificationTime);
      console.log(`Scheduling notification for ${user.name} at ${notificationTime} (${cronTime})`);
      
      cron.schedule(cronTime, () => {
        console.log(`Sending notification for ${user.name} at ${notificationTime}`);
        sendNotification(user.token, "Reminder", "This is your scheduled notification!");
      }, {
        scheduled: true,
        timezone: "Asia/Kolkata"  // Set your timezone
      });

    }catch(error){
    console.log("error in schedule------>",error)


    }
}


server.post('/add-user', async (req, res) => {
  const { name, notificationTime, fcmToken } = req.body;
  const newUser = await prisma.user.create({
    data: { name, notificationTime, fcmToken }
  });
  scheduleNotificationForUser(newUser.id); // Schedule notification after adding user
  res.status(201).json(newUser);
});
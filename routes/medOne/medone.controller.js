const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { encrypt, decrypt } = require("../../utils");
const winston = require("winston");
const { request, response } = require("express");
const logDirectory = "./logs";
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const res = require("express/lib/response");
const { closeSync } = require("fs");
const cron = require('node-cron')
const { GoogleGenerativeAI } = require("@google/generative-ai");
const schedule = require('node-schedule');

// const { use } = require("bcrypt/promises");

//function for deleting the data within 24hrs
cron.schedule('0 0 * * *', async () => {
  const twentyFourHoursAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
  try {
    await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: twentyFourHoursAgo }
      }
    });
    console.log('Old notifications deleted successfully.');
  } catch (error) {
    console.error('Error deleting old notifications:', error);
  }
});

// //for running the morning notification
// cron.schedule('0 5 * * *', () => {
//   console.log("Running morning notification job...");
//   realTimeNotification(/* request, response */);
// });

// //for running the luch time notification
// cron.schedule('0 12 * * *', () => {
//   console.log("Running lunch notification job...");
//   realTimeNotification(/* request, response */);
// });

// //for running the dinner time notification
// cron.schedule('0 18 * * *', () => {
//   console.log("Running dinner notification job...");
//   realTimeNotification(/* request, response */);
// });


const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({
        filename: `${logDirectory}/error.log`,
        level: "error",
      }),
      new winston.transports.File({ filename: `${logDirectory}/combined.log` }),
    ],
  });



// Helper function to convert "12:00 PM" format into a Date object
function convertTimeTo24Hour(timeStr) {
  const [time, modifier] = timeStr.split(' '); // Split time and AM/PM
  let [hours, minutes] = time.split(':');

  if (modifier === 'PM' && hours !== '12') {
    hours = parseInt(hours, 10) + 12;
  }
  if (modifier === 'AM' && hours === '12') {
    hours = '00';
  }

  // Create a new Date object and set hours/minutes
  const currentDate = new Date();
  currentDate.setHours(parseInt(hours, 10));
  currentDate.setMinutes(parseInt(minutes, 10));
  currentDate.setSeconds(0); // Set seconds to 0

  return currentDate;
}

  function scheduleNotification(time, message) {
    const delay = time - new Date(); // Calculate delay in milliseconds
    if (delay > 0) {
      setTimeout(() => {
        console.log(`Notification: ${message}`);
        // Here you can send the notification (push notification, SMS, etc.)
      }, delay);
    }
  }

const addUserData = async(request,response)=>{
console.log({request})
// logger.response({request})
    const secretKey = process.env.ENCRYPTION_KEY;
    const safeDecrypt = (text, key) => {
      try {
        return decrypt(text, key);
      } catch (err) {
        return text;
      }
    };
    try{
        const{
            userid,
            name,
            gender,
            dob,
            health_condition,
            height,
            weight,
            
        } = request.body
        const userimg = request.file?.location || request.body.image;
        console.log({userimg})
        

      const findUser = await prisma.user_details.findMany({
        where:{
           id:userid
        }
    })
    console.log({findUser})
    if(!findUser){
        return response.status(400).json({
            error:true,
            success:false,
            message:"User not found"
        })
    }else{
        const encryptname   = encrypt(name, secretKey)
        const encryptgender = encrypt(gender, secretKey)
        const encryptdob    = encrypt(dob, secretKey)
       
        
        const addingUserDetails = await prisma.user_details.update({
            where:{
                id:userid
            },
            data:{
                name:encryptname,
                gender:encryptgender,
                ageGroup:encryptdob,
                health_condition:health_condition,
                height:height,
                weight:weight,
                image:userimg
            }
        })
        console.log({addingUserDetails})

        const decryptName = safeDecrypt(addingUserDetails.name, secretKey)
        const decryptgender = safeDecrypt(addingUserDetails?.gender, secretKey)
        const decryptageGroup = safeDecrypt(addingUserDetails?.ageGroup, secretKey)
        
        addingUserDetails.name =decryptName;
        addingUserDetails.gender = decryptgender;
        addingUserDetails.ageGroup = decryptageGroup

        return response.status(200).json({
          error:"false",
          success:"true",
          message:"SuccessFully added user details",
          // addingUserDetails,
          data:addingUserDetails
        })

    }
  }catch (error) {
        console.log({error})
        response.status(500).json({
            error:true,
            success:false,
        });
        logger.error(`Internal server error: ${error.message} in medone-addUserData api`);
      } finally {
        await prisma.$disconnect();
      }
}




const userLogin = async (request, response) => {
  console.log("userloginnnn");
  const { email, password } = request.body;
  console.log({request})
  const safeDecrypt = (text, key) => {
    try {
      return decrypt(text, key);
    } catch (err) {
      return text;
    }
  };
  const secretKey = process.env.ENCRYPTION_KEY;
  const currentDate = new Date();
  const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
  const istDate = new Date(currentDate.getTime() + istOffset);

  if (!email || !password) {
    return response.status(401).json({
      error: true,
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    const emaillower = email.toLowerCase();
    const email_id = emaillower;
    if (validateEmail(email_id)) {
      console.log("Valid email address");
    } else {
      console.log("Invalid email address");
      const resptext = "Invalid email address";
      return response.status(401).json({
        error: true,
        success: false,
        message: resptext,
      });
    }
    function validateEmail(email_id) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email_id);
    }

    // Fetch all users (or use findUnique)
    const users = await prisma.user_details.findMany();
    console.log({users})
    let user = null;

    for (const dbUser of users) {
      let decryptedEmail;
      try {
        decryptedEmail = safeDecrypt(dbUser.email, secretKey);
      } catch (error) {
        console.warn(
          `Skipping user ID ${dbUser.id} due to decryption error`,
          error
        );
        continue;
      }

      if (decryptedEmail === emaillower) {
        user = dbUser;
        break;
      }
    }

    if (!user) {
      return response.status(401).json({
        error: true,
        success: false,
        message: "User does not exist",
      });
    }

    const logged_id = user.id;
    const hashedDbPassword = user.password;

    // Compare the provided password with the hashed password from the database
    bcrypt.compare(password, hashedDbPassword, async (error, result) => {
      if (error) {
        return response.status(500).json({
          error: true,
          success: false,
          message: "Password hashing error",
        });
      }

      if (!result) {
        return response.status(401).json({
          error: true,
          success: false,
          message: "Please check your password!",
        });
      }
      // console.log({logged_id})
      // Fetch user data after password verification
      const userDataArray = await prisma.user_details.findMany({
        where: { id: logged_id }
      });

      if (!userDataArray || userDataArray.length === 0) {
        return response.status(404).json({
          error: true,
          success: false,
          message: "User data not found",
        });
      }

      const userData = userDataArray[0]; // Access the first user data

      // Decrypt the user data fields
      const decryptName = safeDecrypt(userData.name, secretKey);
      const decryptGender = safeDecrypt(userData.gender, secretKey);
      const decryptAgeGroup = safeDecrypt(userData.ageGroup, secretKey);

      // Update userData object with decrypted values
      userData.name = decryptName;
      userData.gender = decryptGender;
      userData.ageGroup = decryptAgeGroup;

      // Generate tokens
      const refreshTokenPayload = {
        userId: logged_id,
      };

      const accessTokenPayload = {
        userId: logged_id,
      };

      const refreshTokenOptions = {
        expiresIn: "900m",
      };

      const accessTokenOptions = {
        expiresIn: "100m",
      };

      const refreshToken = jwt.sign(
        refreshTokenPayload,
        process.env.REFRESH_TOKEN_SECRET,
        refreshTokenOptions
      );

      const accessToken = jwt.sign(
        accessTokenPayload,
        process.env.ACCESS_TOKEN_SECRET,
        accessTokenOptions
      );

      // Update last active time
      await prisma.user_details.update({
        where: { id: logged_id },
        data: { last_active: istDate },
      });
      console.log({logged_id})
      //check whether there is data in dailyRoutine table
      const findRoutine = await prisma.dailyRoutine.findMany({
        where:{
          userId:logged_id
        }
      })
      console.log({findRoutine})
      if(findRoutine.length === 0){
        return response.status(200).json({
          success: true,
          error: false,
          message: "Login successful",
          refreshToken,
          accessToken,
          userId: logged_id,
          userData, // Decrypted user data
          routine:"false"
        })
      }
      // Return response with decrypted user data and tokens
      return response.status(200).json({
        success: true,
        error: false,
        message: "Login successful",
        refreshToken,
        accessToken,
        userId: logged_id,
        userData, // Decrypted user data
        routine:"true"
      });
    });
  } catch (error) {
    console.log({ error });
    logger.error(`Internal server error: ${error.message} in userLogin API`);
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  } finally {
    await prisma.$disconnect();
  }
};



const addRoutine = async(request,response)=>{
  const currentDate = new Date();
  const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
  const istDate = new Date(currentDate.getTime() + istOffset);
  try{
    const {
      userId,
      routine 
    } = request.body
    const findExistingRoutine = await prisma.dailyRoutine.findMany({
      where:{
        userId:userId
      }
    })
    console.log({findExistingRoutine})
    if(findExistingRoutine.length > 0){
      return response.status(400).json({
        error:true,
        success:false,
        message:"Already created a routine"
      })
    }

    const addRoutine = await prisma.dailyRoutine.create({
     data:{
        userId:userId,
        routine:routine,
        created_date:istDate
     }
    })  
    console.log({addRoutine})

    response.status(200).json({
      error:"false",
      success:"true",
      message:"Successfully added the routine",
      data:addRoutine
    })
  }catch (error) {
    console.log({error})
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-addRoutine api`);
  } finally {
    await prisma.$disconnect();
  }

}


const getUserRoutine = async(request,response)=>{
  try{
    const{userId} = request.body

    const getRoutine = await prisma.dailyRoutine.findMany({
      where:{
        userId:userId
      }
    })
  console.log({getRoutine})
  response.status(200).json({
    error:false,
    success:true,
    message:"Successfull",
    data:getRoutine
  })
  }catch (error) {
    console.log({error})
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-getUserRoutine api`);
  } finally {
    await prisma.$disconnect();
  }
}


const getMedicine = async(request,response)=>{
  try{
    const getmedicine = await prisma.generic_product.findMany({
      where:{
        is_active:"Y",
        category:{
          array_contains:["MEDICINES"]
        }
      },
      select:{
        id:true,
        name:true,
        images:true,
        category:true
      }
    })
    console.log({getmedicine})
    response.status(200).json({
      error:false,
      success:true,
      message:"Successfull",
      data:getmedicine
    })
}catch (error) {
  console.log({error})
  response.status(500).json(error.message);
  logger.error(`Internal server error: ${error.message} in medone-getmedicine api`);
} finally {
  await prisma.$disconnect();
}
}


const addNewMedicine = async (request, response) => {
  try {
    const currentDate = new Date();
    const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
    const istDate = new Date(currentDate.getTime() + istOffset);
    const { name, category, userId } = request.body;

    const findMedicine = await prisma.medicines.findMany({
      where: {
        name: name,
      },
    });

    if (findMedicine.length > 0) { // Check if any medicine is found
      const medName = findMedicine[0].name;
      console.log({ medName });
      return response.status(200).json({
        error: false,
        success: true,
        message: "Medicine already in the list......",
      });
    } else {
      const addMedicine = await prisma.medicines.create({
        data: {
          name: name,
          status: "Pending",
          created_date: istDate,
          created_by: userId,
          category: category,
        },
      });

      console.log({ addMedicine });

      response.status(200).json({
        error: false,
        success: true,
        message: "Successfully added the medicine",
        data: addMedicine,
      });
    }
  } catch (error) {
    console.log({ error });
    response.status(500).json({ error: true, message: error.message });
    logger.error(
      `Internal server error: ${error.message} in medone-addnewmedicine api`
    );
  } finally {
    await prisma.$disconnect();
  }
};



const addMedicineSchedule = async(request,response)=>{
  const currentDate = new Date();
  const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
  const istDate = new Date(currentDate.getTime() + istOffset);
  try{
    const{
        userId,
        medicine,
        medicine_type,
        image,
        startDate,
        no_of_days,
        afterFd_beforeFd,
        totalQuantity,
        timing,
        timeInterval,
        daysInterval,
        takingQuantity
    }=request.body

    const addSchedule = await prisma.medicine_timetable.create({
      data:{
        userId:userId,
        medicine:medicine,
        medicine_type:medicine_type,
        image:image,
        startDate:startDate,
        no_of_days:no_of_days,
        afterFd_beforeFd:afterFd_beforeFd,
        totalQuantity:totalQuantity,
        timing:timing,
        timeInterval:timeInterval,
        takingQuantity:takingQuantity,
        daysInterval:daysInterval,
        created_date:istDate, //change to dateTime
        app_flag:true,
        active_status:"true"
      }
    })
   console.log({addSchedule})
   response.status(200).json({
    error:false,
    success:true,
    message:"Successfully added the schedule",
    data:addSchedule
   })
  }catch (error) {
    console.log({error})
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-addMedicineSchedule api`);
  } finally {
    await prisma.$disconnect();
  }
}







// const notifyMedicineSchedule = async (request, response) => {
//   try {
//     const { userid } = request.body;

//     // Fetch user routine
//     const findRoutine = await prisma.dailyRoutine.findFirst({
//       where: { userId: userid },
//     });
//      console.log({findRoutine})
//     if (!findRoutine) {
//       return response.status(404).json({
//         error: true,
//         success: false,
//         message: "User routine not found",
//       });
//     }

//     const routineData = findRoutine.routine;
//     const breakfastTimeString = routineData[0].breakfast || null;
//     const lunchTimeString = routineData[0].lunch || null;
//     const dinnerTimeString = routineData[0].dinner || null;

//     if (!breakfastTimeString || !lunchTimeString || !dinnerTimeString) {
//       return response.status(400).json({
//         error: true,
//         success: false,
//         message: "Invalid or missing meal times in user's routine",
//       });
//     }

//     // Fetch medicine schedule
//     const medicineSchedule = await prisma.medicine_timetable.findMany({
//       where: { userId: userid },
//       select: {
//         id: true,
//         userId: true,
//         medicine: true,
//         medicine_type: true,
//         startDate: true,
//         no_of_days: true,
//         afterFd_beforeFd: true,
//         totalQuantity: true,
//         timing: true,
//         timeInterval: true,
//         takingQuantity: true,
//       },
//     });

//     if (!medicineSchedule || medicineSchedule.length === 0) {
//       return response.status(404).json({
//         error: true,
//         success: false,
//         message: "No medicine schedule found for this user",
//       });
//     }

//     const getRoutineTime = (timeString) => {
//       const currentDate = new Date();
//       const dateString = currentDate.toISOString().split('T')[0]; // Get current date
//       const convertedTime = convertTime(timeString);
//       return new Date(`${dateString}T${convertedTime}:00`);
//     };

//     const getTimeOfDay = (time) => {
//       // Check if time is not a string, convert to string
//       if (typeof time !== 'string') {
//         console.error(`Expected string for time, but got ${typeof time}:`, time);
//         return null; // or handle accordingly
//       }

//       const lowerCaseTime = time.toLowerCase();
//       if (lowerCaseTime === 'morning') return 'Morning';
//       if (lowerCaseTime === 'lunch') return 'lunch';
//       if (lowerCaseTime === 'dinner') return 'dinner';

//       const [hours] = time.split(':');
//       const hour = parseInt(hours, 10);

//       if (hour >= 5 && hour < 11) return 'Morning';
//       if (hour >= 11 && hour < 17) return 'lunch';
//       return 'dinner';
//     };

//     let notifications = [];
//     for (const medicine of medicineSchedule) {
//       const { timing, afterFd_beforeFd, startDate, no_of_days, id } = medicine;
    
//       if (!timing || !startDate) continue;
//       const times = Object.values(timing[0]);
//       console.log("Times for medicine ID", id, ":", times);
    
//       const startDateObj = new Date(startDate.replace(/\//g, '-'));
//       const numberOfDays = parseInt(no_of_days, 10);
//       const endDate = new Date(startDateObj);
//       endDate.setDate(endDate.getDate() + numberOfDays);
    
//       const todayDate = new Date().toISOString().split('T')[0];
    
//       const takenRecord = await prisma.medication_records.findMany({
//         where: {
//           userId: userid,
//           timetable_id: id,
//           // status: 'Taken',
//           status: {
//             in: ['Taken', 'Skipped'],
//           }, 
//           created_date: {
//             gte: new Date(todayDate + "T00:00:00.000Z"),
//             lt: new Date(todayDate + "T23:59:59.999Z"),
//           },
//         },
//       });
    
//       console.log("Today's taken records for medicine ID", id, ":", takenRecord);
    
//       const takenTimes = takenRecord.map(record => record.taken_time.toLowerCase());
//       console.log("Taken times for medicine ID", id, ":", takenTimes);
    
//       const notTakenTimes = times.filter(t => !takenTimes.includes(t.toLowerCase()));
//       console.log("notTakenTimes for medicine ID", id, ":", notTakenTimes);
    
//       for (const notifyTime of notTakenTimes) {
//         const notifyTimeOfDay = getTimeOfDay(notifyTime);
//         let notificationTime;
//         console.log("Processing notifyTime:", notifyTime);
    
//         if (notifyTimeOfDay === "Morning") {
//           const breakfastTime = getRoutineTime(breakfastTimeString);
//           notificationTime = afterFd_beforeFd === "before food"
//             ? new Date(breakfastTime.getTime() - 45 * 60000)
//             : breakfastTime;
//         } else if (notifyTimeOfDay === "lunch") {
//           const lunchTime = getRoutineTime(lunchTimeString);
//           notificationTime = afterFd_beforeFd === "before food"
//             ? new Date(lunchTime.getTime() - 45 * 60000)
//             : lunchTime;
//         } else if (notifyTimeOfDay === "dinner") {
//           const dinnerTime = getRoutineTime(dinnerTimeString);
//           notificationTime = afterFd_beforeFd === "before food"
//             ? new Date(dinnerTime.getTime() - 45 * 60000)
//             : dinnerTime;
//         }
//     console.log({notifyTimeOfDay})
//         console.log("Calculated notificationTime for", notifyTimeOfDay, ":", notificationTime);

  
//         if (notificationTime && !isNaN(notificationTime)) {
//           notifications.push({
//             medicine_timetableID: id,
//             medicine: medicine.medicine[0].name,
//             medicine_type: medicine.medicine_type,
//             notificationTime: notificationTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
//             timeOfDay: notifyTimeOfDay,
//           });
//         }
     
        
//       }
//     }
//   //checking whether the notification is null or not 
//     if (notifications.length === 0) {
//       console.log("No notifications scheduled.");
//       return response.status(404).json({
//         error: true,
//         success: false,
//         message: "No notifications scheduled",
//       });
//     }
    
//     console.log("Final notifications list:", notifications);
    

//     // Sort notifications by time of day
//     notifications.sort((a, b) => {
//       const timeOrder = { Morning: 1, lunch: 2, dinner: 3 };
//       return timeOrder[a.timeOfDay] - timeOrder[b.timeOfDay];
//     });

//     return response.status(200).json({
//       error: false,
//       success: true,
//       message: "Notifications scheduled",
//       notifications: notifications,
//     });

//   } catch (error) {
//     console.error({ error });
//     return response.status(500).json({ error: error.message });
//   }
// };





const notifyMedicineSchedule = async (request, response) => {
  try {
    const { userid } = request.body;
    process.env.TZ = 'Asia/Kolkata';

    // Fetch user routine
    const findRoutine = await prisma.dailyRoutine.findFirst({
      where: { userId: userid },
    });

    if (!findRoutine) {
      return response.status(404).json({
        error: true,
        success: false,
        message: "User routine not found",
      });
    }

    const routineData = findRoutine.routine;
    const breakfastTimeString = routineData[0].breakfast || null;
    const lunchTimeString = routineData[0].lunch || null;
    const dinnerTimeString = routineData[0].dinner || null;

    if (!breakfastTimeString || !lunchTimeString || !dinnerTimeString) {
      return response.status(400).json({
        error: true,
        success: false,
        message: "Invalid or missing meal times in user's routine",
      });
    }

    // Fetch medicine schedule
    const medicineSchedule = await prisma.medicine_timetable.findMany({
      where: { userId: userid },
      select: {
        id: true,
        medicine: true,
        timing: true,
        afterFd_beforeFd: true,
        medicine_type: true,
        startDate: true,
        no_of_days: true,
      },
    });

    if (!medicineSchedule || medicineSchedule.length === 0) {
      return response.status(404).json({
        error: true,
        success: false,
        message: "No medicine schedule found for this user",
      });
    }

    const now = new Date();
    const parseTime = (timeString) => {
      const [hours, minutes] = timeString.split(/[: ]/).map(Number);
      const isPM = timeString.includes("PM");
      const date = new Date();
      date.setHours(isPM && hours !== 12 ? hours + 12 : hours === 12 && !isPM ? 0 : hours, minutes);
      return date;
    };

    const mealTimes = {
      Morning: parseTime(breakfastTimeString),
      lunch: parseTime(lunchTimeString),
      dinner: parseTime(dinnerTimeString),
    };

    let notifications = [];
    for (const medicine of medicineSchedule) {
      const { timing, afterFd_beforeFd, id } = medicine;
      const times = Object.values(timing[0]);

      const startDateObj = new Date(medicine.startDate);
      const numberOfDays = parseInt(medicine.no_of_days, 10);
      const endDate = new Date(startDateObj);
      endDate.setDate(endDate.getDate() + numberOfDays);

      const currentDate = new Date();
      if (currentDate < startDateObj || currentDate > endDate) {
        console.log(`Skipping medicine ID: ${id} as it is out of the active range`);
        continue;
      }

      for (const notifyTime of times) {
        const notifyTimeOfDay = notifyTime.toLowerCase();
         console.log({notifyTimeOfDay})
        // Check if the medicine has already been taken
        const existingTakenRecord = await prisma.medication_records.findFirst({
          where: {
            userId: userid,
            timetable_id: id,
            taken_time: notifyTimeOfDay,
            created_date: {
              gte: new Date(currentDate.toISOString().split("T")[0] + "T00:00:00.000Z"),
              lt: new Date(currentDate.toISOString().split("T")[0] + "T23:59:59.999Z"),
            },
            status: "Taken",
          },
        });

        if (existingTakenRecord) {
          console.log(`Skipping notification for medicine ID: ${id} as it is already taken for ${notifyTimeOfDay}`);
          continue;
        }

        let notificationTime;
        if (notifyTimeOfDay === "morning") {
          notificationTime = afterFd_beforeFd === "before food"
            ? new Date(mealTimes.Morning.getTime() - 45 * 60000)
            : mealTimes.Morning;
        } else if (notifyTimeOfDay === "lunch") {
          notificationTime = afterFd_beforeFd === "before food"
            ? new Date(mealTimes.lunch.getTime() - 45 * 60000)
            : mealTimes.lunch;
        } else if (notifyTimeOfDay === "dinner") {
          notificationTime = afterFd_beforeFd === "before food"
            ? new Date(mealTimes.dinner.getTime() - 45 * 60000)
            : mealTimes.dinner;
        }

        if (notificationTime) {
          const validUntil = new Date(notificationTime.getTime() + 2 * 60 * 60 * 1000);

          if (now <= validUntil) {
            notifications.push({
              medicine_timetableID: id,
              medicine: medicine.medicine[0].name,
              notificationTime: notificationTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
              medicine_type: medicine.medicine_type,
              validUntil: validUntil.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
              timeOfDay: notifyTimeOfDay,
            });
          }
        }
      }
    }
    // Sort notifications by time of day
    notifications.sort((a, b) => {
      const timeOrder = { morning: 1, lunch: 2, dinner: 3 };
      return timeOrder[a.timeOfDay] - timeOrder[b.timeOfDay];
    });


    if (notifications.length === 0) {
      return response.status(404).json({
        error: true,
        success: false,
        message: "No notifications scheduled",
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      message: "Notifications scheduled",
      notifications,
    });
  } catch (error) {
    console.error({ error });
    return response.status(500).json({ error: error.message });
  }
};








const convertTime = (timeString) => {
  if (!timeString || typeof timeString !== 'string') {
    console.error("Invalid time string:", timeString);
    return null;
  }

  const [time, modifier] = timeString.split(' ');
  let [hours, minutes] = time.split(':');

  if (hours === '12') {
    // Keep '12' as is for PM, but convert '12 AM' to '00'
    if (modifier === 'AM') {
      hours = '00';
    }
  } else if (modifier === 'PM') {
    // Convert PM times, except for 12 PM, to 24-hour format
    hours = String(parseInt(hours, 10) + 12);
  }

  return `${hours.padStart(2, '0')}:${minutes}`;
};















const userProfile = async(request,response)=>{
  console.log({request})
  try{
    const secretKey = process.env.ENCRYPTION_KEY;
    
  const safeDecrypt = (text, key) => {
    try {
      return decrypt(text, key);
    } catch (err) {
      return text;
    }
  };

    const {userId} = request.body
    if(!userId){
      return response.status(404).json({
        error:true,
        success:false,
        message:"User id is null..."
      })
    }
    const userData = await prisma.user_details.findUnique({
      where:{
         id:userId
      }
    })
    if(!userData){
      return response.status(404)({
        error:true, 
        success:false,
        message:"User not found"
      })
    }

    const decryptedname = safeDecrypt(userData.name, secretKey);
    const decryptedageGroup = safeDecrypt(userData?.ageGroup, secretKey);
    const decryptgender = safeDecrypt(userData?.gender, secretKey);

    userData.name = decryptedname;
    userData.ageGroup = decryptedageGroup;
    userData.gender = decryptgender;

    return response.status(200).json({
      error:false,
      success:true,
      message:"Successfull",
      data:userData
    })

  }catch (error) {
    console.log({ error });
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-userprofile api`);
  } finally {
    await prisma.$disconnect();
  }
}

const editRoutine = async(request,response)=>{
  try{
    const {
         userId,
         routine
    } = request.body
   
    if(!userId && !routine){
      return response.status(404).json({
        error:true,
        success:false,
        message:"User id and routine data are needed"
      })
    }
    const editdata = await prisma.dailyRoutine.updateMany({
      where:{
        userId:userId
      },
      data:{
        routine:routine
      }
    })
    console.log({editdata})
    return response.status(200).json({
      error:false,
      success:true,
      message:"Successfully edited",
      data:editdata
    })
  }catch (error) {
    console.log({ error });
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-editroutine api`);
  } finally {
    await prisma.$disconnect();
  }
}

const editMedicineSchedule = async(request,response)=>{
  try{
    const{
      scheduleId,
      medicine,
      medicine_type,
      startDate,
      no_of_days,
      afterFd_beforeFd,
      totalQuantity,
      timing,
      timeInterval,
      takingQuantity,
      daysInterval
    } = request.body
    const editSchedule = await prisma.medicine_timetable.updateMany({
      where:{
        id:scheduleId
      },
      data:{
          medicine:medicine,
          medicine_type:medicine_type,
          startDate:startDate,
          no_of_days:no_of_days,
          afterFd_beforeFd:afterFd_beforeFd,
          totalQuantity:totalQuantity,
          timing:timing,
          timeInterval:timeInterval,
          takingQuantity:takingQuantity,
          daysInterval:daysInterval
      }
    })
    console.log({editSchedule})
    const getEditedData= await prisma.medicine_timetable.findMany({
      where:{
        id:scheduleId
      }
    })
    console.log(getEditedData)
    return response.status(200).json({
      error:false,
      success:true,
      message:"Successfully edited the schedule",
      data:getEditedData
    })

  }catch (error) {
    console.log({ error });
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-editschedule api`);
  } finally {
    await prisma.$disconnect();
  }
}

const getUserSchedule = async(request,response)=>{
  try{
    const {userId} = request.body
    if(!userId){
      return response.status(404).json({
        error:true,
        success:false,
        message:"User id required......"
      })
    }
    const getSchedule = await prisma.medicine_timetable.findMany({
      where:{
        userId:userId
      }
    })
    console.log({getSchedule})
    if(getSchedule.length === 0){
      return response.status(404).json({
        error:true,
        success:false,
        message:'Medicine schedule not found'
      })
    }
    return response.status(200).json({
      error:true,
      success:false,
      message:"Successfull",
      data:getSchedule
    })
  }catch (error) {
    console.log({ error });
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-getuserschedule api`);
  } finally {
    await prisma.$disconnect();
  }
}

//for adding status to the medication_records
const addStatus = async(request,response)=>{
  console.log({request})
  try{
    const{
         userId,
         timetableId,
         status,
         takenTime,
         takenStatus
        } = request.body
    const date = new Date()
    // const medicineTakenTime = request.body.takenTime
    // console.log({medicineTakenTime})
    const addResponse = await prisma.medication_records.create({
      data:{
        userId:userId,
        timetable_id:timetableId,
        status:status,
        taken_time:takenTime,
        taken_status:takenStatus,
        created_date:date
      }
    })
    console.log({addResponse})
    return response.status(200).json({
      error:false,
      success:true,
      message:"SuccessFull",
      data:addResponse
    })
  }catch (error) {
    console.log({ error });
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-addStatus api`);
  } finally {
    await prisma.$disconnect();
  }
}


//get medication history of the user


const getMedicationHistory = async(request,response)=>{
  try{
    const{
      userId
    } = request.body
    
    if(!userId){
      return response.status(404).json({
        error:true,
        success:false,
        message:"User id is required......."
      })
    }
    const medicationHistory = await prisma.medication_records.findMany({
      where:{
        userId:userId
      }
    })
    console.log({medicationHistory})
    const medicineName = []
    for(let i=0; i<medicationHistory.length; i++){
      const timeTableId = medicationHistory[i].timetable_id
      console.log({timeTableId})

      const getTimetable = await prisma.medicine_timetable.findFirst({
        where:{
          id:timeTableId
        }
        
      })
      // console.log({getTimetable})
      const medicinename =getTimetable.medicine?.[0]?.name || "Unknown";
      console.log({medicinename})
      medicineName.push({
        id: medicationHistory[i].id,
        userId: medicationHistory[i].userId,
        // timetableId: timeTableId,
        startDate: medicationHistory[i].startDate,
        takenTime: medicationHistory[i].taken_time,
        takenStatus: medicationHistory[i].taken_status,
        status:medicationHistory[i].status,
        createdDate: medicationHistory[i].created_date,
        medicinename,
      })
    }
    return response.status(200).json({
      error:false,
      success:true,
      message:"Successfull",
      data:medicineName
    })
  }catch (error) {
    console.log({ error });
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-medicationhistory api`);
  } finally {
    await prisma.$disconnect();
  }
}

//refill alert for medicine
const refillNotification = async(request,response)=>{
  try{
    const {userId} = request.body
    
    const findMedicines = await prisma.medicine_timetable.findMany({
      where:{
        userId:userId
      }
    })
    console.log({findMedicines})
    const medicineCount = []
    const notifications =[]
    for(let i=0; i<findMedicines.length;i++){
      const timeTable_id = findMedicines[i].id
      console.log({timeTable_id})
      const medicine = findMedicines[i].medicine
      console.log({medicine})
      const quantity =findMedicines[i].totalQuantity
      console.log({quantity})
      
      const medicationData = await prisma.medication_records.count({
        where:{
          timetable_id:timeTable_id,
          taken_status:"Yes"
        },
        
      })
      console.log({medicationData})

      const remainingQuantity = quantity - medicationData
      console.log({remainingQuantity})
      const message =`Refill needed for medicine ${findMedicines[i].medicine[0].name}, only 25% remaining.`
      if (remainingQuantity <= 3) {
        notifications.push({
          medicineId: timeTable_id,
          message:message
          // message: `Refill needed for medicine ${findMedicines[i].medicine[0].name}, only 25% remaining.`,
        });
        const addNotification = await prisma.notification.create({
          data:{
            user_id:userId,
            message:message,
            status:"Not seen",
            // data:clg
  
          }
        })
        console.log({addNotification})
      }
     
      medicineCount.push(medicationData)
     
    }
    return response.status(200).json({
      error:false,
      success:true,
      message:"Successfull",
      // data: findMedicines,
      // medicineCount: medicineCount,
      notifications: notifications,
    })
    
  }catch (error) {
    console.log({ error });
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-refillnotification api`);
  } finally {
    await prisma.$disconnect();
  }
}

// const realTimeNotification = async (request, response) => {
//   console.log({request})
//   try {
//     // const { userId } = request.body;
//     process.env.TZ = 'Asia/Kolkata';
     
//     //notification delete
//     const twentyFourHoursAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
//     const findUsers = await prisma.user_details.findMany()
//     console.log({findUsers})

//     for(let i=0; i<findUsers.length; i++){
//       const userId = findUsers[i].id
//       console.log({userId})
    
//     // Retrieve user's routine
//     const getRoutine = await prisma.dailyRoutine.findFirst({
//       where: { userId: userId },
//     });
//     console.log("getRoutine----->",getRoutine.routine[0])
//     if (!getRoutine || !getRoutine.routine[0]) {
//       return response.status(400).json({
//         error: true,
//         success: false,
//         message: "Routine not found.",
//       });
//     }

//     const { breakfast, lunch, dinner } = getRoutine.routine[0];
//     console.log({breakfast, lunch, dinner})
//     // Retrieve user's medicine timetable
//     const getMedicineTT = await prisma.medicine_timetable.findMany({
//       where: { userId: userId },
//     });
//     console.log({getMedicineTT})
//     // Set current time in IST and get current period
//     const currentTimeUTC = new Date();
//     console.log({currentTimeUTC})
//     const currentTimeIST = new Date(currentTimeUTC.getTime());
//     const currentHours = currentTimeIST.getHours();
//      console.log({currentHours})

//     let currentMeal = null;
//     if (currentHours >= 5 && currentHours < 11) {
//       currentMeal = "Morning";
//     } else if (currentHours >= 11 && currentHours < 18) {
//       currentMeal = "lunch";
//     } else if (currentHours >= 18 && currentHours < 24) {
//       currentMeal = "dinner";
//     }
//     console.log({currentMeal})

//     if (!currentMeal) {
//       return response.status(200).json({
//         error: false,
//         success: true,
//         message: "No meals scheduled for this time.",
//       });
//     }

// // Parse meal times in HH:MM AM/PM format and convert to UTC format with IST timings
// const parseMealTime = (mealTime) => {
//   const date = new Date();
//   const [time, modifier] = mealTime.split(' ');
//   let [hours, minutes] = time.split(':').map(Number);

//   // Convert 12-hour format to 24-hour format based on AM/PM
//   if (modifier === 'PM' && hours < 12) hours += 12;
//   else if (modifier === 'AM' && hours === 12) hours = 0;

//   // Set time in IST and then convert to UTC
//   date.setHours(hours - 5);  // Adjusting hours to get UTC equivalent of IST time
//   date.setMinutes(minutes - 30); // Adjusting minutes to get UTC equivalent of IST time
//   date.setSeconds(0);
//   date.setMilliseconds(0);

//   return date;
// };



// const mealTimes = {
//   Morning: parseMealTime(breakfast),
//   Lunch: parseMealTime(lunch),
//   Dinner: parseMealTime(dinner),
// };

// // Display the meal times in UTC (Zulu format)
// console.log({mealTimes});




//     // Create notifications based on medicine schedule
//     const notifications = [];
//     for (const med of getMedicineTT) {
//       // console.log("hhhhhhhhh")
//       const timings = Object.values(med.timing[0])
      
//       if (timings.includes(currentMeal)) {
//         // console.log("uunnnunuu")
//         let medicineTime;
//         if(currentMeal === "Morning"){
//         medicineTime =  getRoutine.routine[0].breakfast
//         } else if(currentMeal === "lunch"){
//           medicineTime =  getRoutine.routine[0].lunch
//         }else{
//           medicineTime =  getRoutine.routine[0].dinner
//         }
//         console.log({medicineTime})
        
//         const message = `Time to take ${med.medicine[0].name} - ${med.afterFd_beforeFd} ${currentMeal}`
//         notifications.push({
//           userId,
//           medicineId: med.id,
//           message
//           // notificationTime,
//         });

//         const addNotification = await prisma.notification.create({
//           data:{
//             user_id:userId,
//             message:message,
//             status:"Not seen",
//             view_status:"false"
//           }
//         })
//         console.log({addNotification})

//         const deleteNotification =  await prisma.notification.deleteMany({
//           where:{
//             created_date:{ lt: twentyFourHoursAgo }
//           }
//         })
//         console.log({deleteNotification})
//       }
//     }
    

//     response.status(200).json({
//       error: false,
//       success: true,
//       message: "Notifications generated successfully",
//       notifications,
//     });
//   }
//   } catch (error) {
//     console.log({ error });
//     response.status(500).json({ message: error.message });
//     logger.error(`Internal server error: ${error.message} in realTimeNotification API`);
//   } finally {
//     await prisma.$disconnect();
//   }
// };


const realTimeNotification = async (request, response) => {
  console.log({ request });
  try {
    const date = new Date()
    // Set timezone to IST
    process.env.TZ = 'Asia/Kolkata';

    // Calculate the time 24 hours ago for notification deletion
    const twentyFourHoursAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);

    // Fetch all users from the `user_details` table
    const users = await prisma.user_details.findMany();
    console.log({ users });   //ok

    if (!users || users.length === 0) {
      return response.status(200).json({
        error: false,
        success: true,
        message: "No users found.",
      });
    }

    const notifications = [];

    for (const user of users) {
      const userId = user.id;
      // console.log({ userId });

      // Retrieve the user's daily routine
      const getRoutine = await prisma.dailyRoutine.findFirst({
        where: { userId: userId },
      });
       console.log({getRoutine})
      if (!getRoutine || !getRoutine.routine[0]) {
        console.log(`No routine found for user ID: ${userId}`);
        continue; // Skip to the next user if no routine exists
      }

      const { breakfast, lunch, dinner } = getRoutine.routine[0];
      console.log({ breakfast, lunch, dinner });

      // Retrieve the user's medicine timetable
      const getMedicineTT = await prisma.medicine_timetable.findMany({
        where: { userId: userId },
      });
      console.log({ getMedicineTT });
      // const numberOfDays = getMedicineTT[0].no_of_days

      // const numberOfDays = parseInt(no_of_days, 10);
      // const endDate = new Date(startDateObj);
      // endDate.setDate(endDate.getDate() + numberOfDays);
    
      if (!getMedicineTT || getMedicineTT.length === 0) {
        console.log(`No medicine timetable found for user ID: ${userId}`);
        continue; // Skip if no medicine timetable exists
      }

      // Determine the current meal based on time
      const currentTimeUTC = new Date();
      const currentHours = new Date(currentTimeUTC.getTime()).getHours();

      let currentMeal = null;
      if (currentHours >= 7 && currentHours < 11) {
        currentMeal = "Morning";
      } else if (currentHours >= 11 && currentHours < 18) {
        currentMeal = "lunch";
      } else if (currentHours >= 18 && currentHours < 24) {
        currentMeal = "dinner";
      }

      console.log({ currentMeal });

      if (!currentMeal) {
        console.log(`No current meal time for user ID: ${userId}`);
        continue; // Skip if no current meal is determined
      }

      // Parse meal times into UTC
      const parseMealTime = (mealTime) => {
        const date = new Date();
        const [time, modifier] = mealTime.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        // Convert 12-hour format to 24-hour
        if (modifier === 'PM' && hours < 12) hours += 12;
        else if (modifier === 'AM' && hours === 12) hours = 0;

        // Convert IST time to UTC
        date.setHours(hours - 5); // Subtract 5 hours for IST -> UTC
        date.setMinutes(minutes - 30); // Subtract 30 minutes for IST -> UTC
        date.setSeconds(0);
        date.setMilliseconds(0);

        return date;
      };

      const mealTimes = {
        Morning: parseMealTime(breakfast),
        Lunch: parseMealTime(lunch),
        Dinner: parseMealTime(dinner),
      };
      console.log({ mealTimes });

      // Create notifications for the current meal
      for (const med of getMedicineTT) {
        // Calculate the endDate based on startDate and no_of_days
        const startDateObj = new Date(med.startDate);
        const numberOfDays = parseInt(med.no_of_days, 10); // Ensure no_of_days is an integer
        const endDate = new Date(startDateObj);
        endDate.setDate(endDate.getDate() + numberOfDays); // Calculate the end date
      
        // Check if the current date is within the range of startDate and endDate
        const currentDate = new Date();
        if (currentDate < startDateObj || currentDate > endDate) {
          console.log(`Skipping medicine ID: ${med.id} as it is out of the active range`);
          continue; // Skip this medicine if the current date is outside the range
        }
      
        const timings = Object.values(med.timing[0]);
      
        // Check if the current meal matches the medicine timing
        if (timings.includes(currentMeal)) {
          let medicineTime;
          if (currentMeal === "Morning") {
            medicineTime = getRoutine.routine[0].breakfast;
          } else if (currentMeal === "lunch") {
            medicineTime = getRoutine.routine[0].lunch;
          } else {
            medicineTime = getRoutine.routine[0].dinner;
          }
      
          const message = `Time to take ${med.medicine[0].name} - ${med.afterFd_beforeFd} ${currentMeal}`;
          notifications.push({
            userId,
            medicineId: med.id,
            message,
          });
         console.log({notifications})
        //findnotification is already exists or not
        const findNotication = await prisma.notification.findMany({
          where:{
            user_id:userId,
            message:message,
            status:"Not seen",
            view_status:"false"
          }
        })
        console.log({findNotication})
         if(findNotication.length === 0){
          // Save the notification to the database
          const addNotification = await prisma.notification.createMany({
            data: {
              user_id: userId,
              message: message,
              status: "Not seen",
              view_status: "false",
              // created_date:date
            },
          });
          console.log({ addNotification });
         }
        }
      }
      

      // Delete notifications older than 24 hours
      const deleteNotification = await prisma.notification.deleteMany({
        where: {
          created_date: { lt: twentyFourHoursAgo },
        },
      });
      console.log({ deleteNotification });
    }

    response.status(200).json({
      error: false,
      success: true,
      message: "Notifications generated successfully.",
      notifications,
    });
  } catch (error) {
    console.log({ error });
    response.status(500).json({ message: error.message });
    logger.error(`Internal server error: ${error.message} in realTimeNotification API`);
  } finally {
    await prisma.$disconnect();
  }
};




// Function to call realTimeNotification for multiple users
const runScheduledNotification = async () => {
  try {
    console.log("Scheduled notification triggered at:", new Date());

    console.log("Running scheduled notification check...");

    // Retrieve all user IDs to process notifications
    const allUsers = await prisma.user_details.findMany({ select: { id: true } });

    for (const user of allUsers) {
      const request = { body: { userId: user.id } };
      const response = {
        status: (statusCode) => ({
          json: (data) => console.log("Scheduled notification response:", data),
        }),
      };
      await realTimeNotification(request, response);
    }
  } catch (error) {
    console.error("Error running scheduled notification:", error);
  }
};

// Schedule the job to run at 5:30 AM, 12:30 PM, and 5:30 PM daily
schedule.scheduleJob('00 7 * * *', runScheduledNotification); // 5:30 AM
schedule.scheduleJob('00 12 * * *', runScheduledNotification); // 11:30 PM
schedule.scheduleJob('00 18 * * *', runScheduledNotification); // 5:30 PM


//get notification
const getNotification = async(request,response)=>{
  const{userId} = request.body
  try{
    const notification = await prisma.notification.findMany({
      where:{
        user_id:userId
      }
    })
    console.log({notification})
    response.status(200).json({
      error:false,
      success:true,
      message:"Successfull",
      data:notification
    })
  }catch (error) {
    console.log({ error });
    response.status(500).json({ message: error.message });
    logger.error(`Internal server error: ${error.message} in getnotification API`);
  } finally {
    await prisma.$disconnect();
  }
}

//add status
const addSeenStatus = async(request,response)=>{
  try{
    const{ user_id,notification_id} = request.body
    
    const addStatus = await prisma.notification.update({
      where:{
        user_id:user_id,
        id:notification_id
      },
      data:{
        status:"Seen"
      }
    })
    console.log({addStatus})
    response.status(200).json({
      error:false,
      success:true,
      message:"Succesfull",
      data:addStatus
    })
  }catch (error) {
    console.log({ error });
    response.status(500).json({ message: error.message });
    logger.error(`Internal server error: ${error.message} in addSeenStatus API`);
  } finally {
    await prisma.$disconnect();
  }
}

// const realTimeNotification = async (request, response) => {
//   try {
//     const { userId } = request.body;

//     // Retrieve user's routine
//     const getRoutine = await prisma.dailyRoutine.findFirst({
//       where: { userId: userId },
//     });

//     if (!getRoutine || !getRoutine.routine[0]) {
//       return response.status(400).json({
//         error: true,
//         success: false,
//         message: "Routine not found.",
//       });
//     }

//     // Extract timings from routine
//     const { breakfast, lunch, dinner } = getRoutine.routine[0];
//     console.log({ breakfast, lunch, dinner });

//     // Set current time in IST
//     const currentTimeUTC = new Date();
//     const currentTime = new Date(currentTimeUTC.getTime()); // Adjust to IST
//     console.log({ currentTime: currentTime.toLocaleString() }); // Outputs current time

//     // Function to convert meal time strings to Date objects
//     const parseMealTime = (mealTime) => {
//       const date = new Date();
//       const [time, modifier] = mealTime.split(' '); // Split time and AM/PM
//       let [hours, minutes] = time.split(':').map(Number); // Split hours and minutes
      
//       // Convert to 24-hour format
//       if (modifier === 'PM' && hours < 12) {
//         hours += 12;
//       } else if (modifier === 'AM' && hours === 12) {
//         hours = 0;
//       }

//       date.setHours(hours);
//       date.setMinutes(minutes);
//       date.setSeconds(0);
//       date.setMilliseconds(0);

//       return date;
//     };

//     // Use consistent casing for meal times
//     const mealTimes = {
//       Morning: parseMealTime(breakfast),
//       Lunch: parseMealTime(lunch), // Change to 'Lunch' with uppercase 'L'
//       Dinner: parseMealTime(dinner), // Change to 'Dinner' with uppercase 'D'
//     };

//     console.log({ mealTimes });

//     const getMedicineTT = await prisma.medicine_timetable.findMany({
//       where: { userId: userId },
//     });

//     const notifications = [];

//     // Determine current meal period
//     let currentMeal;
//     if (currentTime >= mealTimes.Morning && currentTime < mealTimes.Lunch) {
//       currentMeal = "Morning";
//     } else if (currentTime >= mealTimes.Lunch && currentTime < mealTimes.Dinner) {
//       currentMeal = "lunch"; // Change to 'Lunch' with uppercase 'L'
//     } else {
//       currentMeal = "dinner"; // Change to 'Dinner' with uppercase 'D'
//     }
//     console.log({ currentMeal });

//     // Process each medicine and its specified timings
//     // for (const med of getMedicineTT) {
//     for(let i=0; i<getMedicineTT.length; i++){
//       const timingArray = getMedicineTT[i].timing; // Access the first object in the timing array
//       console.log({ timingArray });

//       // Iterate over the timingArray and check for the current meal
//       // for (const [key, timing] of Object.entries(timingArray)) {
//         // Use 'Lunch' instead of 'lunch' for comparison
//         for(let j=0;j<timingArray.length;j++){
//           const timing = timingArray[j]
//           console.log({timing})
//         // const standardizedTiming = timing.charAt(0).toUpperCase() + timing.slice(1); // Capitalize the first letter
//         // console.log({standardizedTiming})
//         // Check if the current meal matches any timing in the timingArray
//         if (timing === currentMeal) {
//           // const mealTime = mealTimes[standardizedTiming];
//           // let notificationTime = new Date(mealTime); // Initialize notification time based on meal time

//           // Adjust notification time based on before/after food
//           // if (med.afterFd_beforeFd === "Before food") {
//           //   notificationTime.setMinutes(mealTime.getMinutes() - 30); // Notify 30 mins before
//           // } else {
//           //   notificationTime.setMinutes(mealTime.getMinutes()); // Notify at meal time
//           // }

//           // Ensure the notification time is set correctly
//           // notificationTime.setHours(mealTime.getHours());

//           // Check if the notification time is in the future (greater than current time)
//           // if (notificationTime > currentTime) {
//             // Push the notification details only if the meal timing is valid
//             notifications.push({
//               userId,
//               // medicineId: med.id,
//               message: `Time to take ${med.medicine[0].name} - ${med.afterFd_beforeFd} ${standardizedTiming}`,
//               // notificationTime,
//             });
//           // }
//         }
//       }
//     }

//     console.log({ notifications });

//     // Send response with notifications
//     response.status(200).json({
//       error: false,
//       success: true,
//       message: "Notifications generated successfully",
//       notifications,
//     });
//   } catch (error) {
//     console.log({ error });
//     response.status(500).json({ message: error.message });
//   } finally {
//     await prisma.$disconnect();
//   }
// };



//edit user profile
const editUserProfile = async(request,response)=>{
  try{
    const secretKey = process.env.ENCRYPTION_KEY;
    
  const safeDecrypt = (text, key) => {
    try {
      return decrypt(text, key);
    } catch (err) {
      return text;
    }
  };

    const {userId,name,dob,gender,health_condition,height,weight} = request.body
    if(!userId){
      return response.status(404).json({
        error:true,
        success:false,
        message:"User id is null..."
      })
    }
    const encryptname   = encrypt(name, secretKey)
    const encryptgender = encrypt(gender, secretKey)
    const encryptdob    = encrypt(dob, secretKey)

    const userData = await prisma.user_details.updateMany({
      where:{
         id:userId
      },
      data:{
        name:encryptname,
        ageGroup:encryptdob,
        gender:encryptgender,
        height:height,
        weight:weight,
        health_condition:health_condition
      }
    })
    if(!userData){
      return response.status(404)({
        error:true, 
        success:false,
        message:"User not found"
      })
    }

    const decryptedname = safeDecrypt(userData.name, secretKey);
    const decryptedageGroup = safeDecrypt(userData?.ageGroup, secretKey);
    const decryptgender = safeDecrypt(userData?.gender, secretKey);

    userData.name = decryptedname;
    userData.ageGroup = decryptedageGroup;
    userData.gender = decryptgender;

    return response.status(200).json({
      error:false,
      success:true,
      message:"Successfull",
      data:userData
    })

  }catch (error) {
    console.log({ error });
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-edituserprofile api`);
  } finally {
    await prisma.$disconnect();
  }
}



//api for storing token
const addToken = async(request,response)=>{
  try{
    const{
      id,
      token
    } = request.body
    const findUser = await prisma.user_details.findFirst({
      where:{
        id:id
      }
    })
    console.log({findUser})
    // const usertoken = findUser.token
    // console.log({usertoken})
    // if(!usertoken){
    const addUsertoken = await prisma.user_details.updateMany({
      where:{
        id:id
      },
      data:{
        token:token
      }
    })
    console.log({addUsertoken})
    return response.status(200).json({
      error:false,
      success:true,
      message:"successfully added token",
      data:addUsertoken
    })
  // }

  }catch (error) {
    console.log({ error });
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-addToken api`);
  } finally {
    await prisma.$disconnect();
  }
}


 

const conversationHistories = {};

const updatedchat = async (request, response) => {
  try {
    // Check for API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing in environment variables");
    }

    // Initialize Google Generative AI with the API Key
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      // Uncomment and customize systemInstruction if needed
      // systemInstruction: "Your name is 'Dr. One.' You only respond to questions related to the medical field. If the question is not related to the medical field, then you will send a funny reply. First, you want to ask for the user's name, gender, and age group. Users will also tell their symptoms so you can suggest the appropriate doctor and specialty. If the doctors are not listed, then just specify which specialty doctor to consider."
    });

    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };

    // Retrieve conversation history for this chat session
    const chatId = request.body.chatId || "default"; // Ensure a unique ID per session if needed
    const conversationHistory = conversationHistories[chatId] || [
      {
        role: "user",
        parts: [
          {
            text: "Your name is 'Med. One.' You only respond to questions related to the medical field. You primarily explain the purpose of medications without going deeply into side effects. If a question is not related to the medical field, you will respond casually. If users ask about their health problems, first ask for their name, gender, and age group. They may also describe their symptoms, allowing you to suggest the appropriate doctor and specialty. If a specific doctor is not listed, specify the relevant specialty instead.",
          },
        ],
      },
    ];

    const chatSession = model.startChat({
      generationConfig,
      history: conversationHistory,
    });

    const userInput = request.body.message;

    if (userInput.toLowerCase() !== "quit") {
      const result = await chatSession.sendMessage(userInput);

      // Safely access the response content
      const responseText =
        result.response.candidates[0]?.content.parts[0]?.text ||
        "Sorry, I couldn't understand that. Could you rephrase?";

      response.status(200).json({
        message: responseText,
      });

      // Update conversation history if there is valid response content
      if (responseText) {
        conversationHistory.push({
          role: "user",
          parts: [{ text: userInput }],
        });
        conversationHistory.push({
          role: "model",
          parts: [{ text: responseText }],
        });
      }

      // Save updated history for the session
      conversationHistories[chatId] = conversationHistory;
    } else {
      await chatSession.endChat(); // Gracefully end the chat session if the input is "quit"
      response.status(200).json({ message: "Chat session ended." });

      // Clear conversation history if chat session ends
      delete conversationHistories[chatId];
    }
  } catch (error) {
    console.error("Error during chat:", error.stack); // More detailed error logging
    response.status(500).json({ error: "An error occurred", details: error.message });
  }
};






// const notificationData = async(request,response)=>{
//   try{
//     const{userId} = request.body
//     const getUserRoutine = await prisma.dailyRoutine.findMany({
//       where:{
//         userId:userId
//       }
//     })
//     console.log({getUserRoutine})
//     const routine = getUserRoutine[0].routine
//     console.log({routine})

//     const findmedicationTT = await prisma.medicine_timetable.findMany({
//       where:{
//         userId:userId
//       }
//     })
//     console.log({findmedicationTT})

//   }catch (error) {
//     console.log({ error });
//     response.status(500).json(error.message);
//     logger.error(`Internal server error: ${error.message} in medone-notificationData api`);
//   } finally {
//     await prisma.$disconnect();
//   }
// }






//getting medine added by user
const getMedicineAddedByUser = async(req,res)=>{
  try{
    const {userId} = req.body
    if(!userId){
      return res.status(200).json({
        error:true,
        success:true,
        message:"UserId is required..............."
      })
    }
    const getMedicine = await prisma.medicine_timetable.findMany({
      where:{
         userId:userId
      },
      select:{
        medicine:true,
        medicine_type:true,
        startDate:true
     }
    })
    console.log({getMedicine})
    res.status(200).json({
      error:false,
      success:true,
      message:"Successfull",
      data:getMedicine
    })

  }catch (error) {
    console.log({ error });
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-getMedicineAddedByUser api`);
  } finally {
    await prisma.$disconnect();
  }
}


const addFeedback = async(req,res)=>{
  try{
     const{userId,medicineId,feedback} = req.body
     const date = new Date()
     if(!feedback){
      return res.status(200).json({
        error:true,
        success:false,
        message:"Feedback is required..........."
      })
     }
     const addMedicine = await prisma.user_feedback.create({
      data:{
        userId:userId,
        medicineId:medicineId,
        feedback:feedback,
        createdDate:date
      }
     })
     console.log({addMedicine})
     res.status(200).json({
      error:false,
      success:true,
      message:"Successfullll",
      data:addMedicine
     })
  }catch (error) {
    console.log({ error });
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-addFeedback api`);
  } finally {
    await prisma.$disconnect();
  }
}


/////getting the user added feedback
const getAddedFeedback = async(req,res)=>{
  try{
    const {userId} = req.body
    if(!userId){
      return res.status(200).json({
        error:true,
        success:false,
        message:"userid is required"
      })
    }
    const getFeedback = await prisma.user_feedback.findMany({
      where:{
        userId:userId
      }
    })
    console.log({getFeedback})
    for(let i=0; i<getFeedback.length; i++){
      const medicineid = getFeedback[i].medicineId
      console.log({medicineid})
      const findmedicine = await prisma.medicine_timetable.findMany({
        where:{
          id:medicineid
        }
      })
      console.log({findmedicine})
      const medicinename = findmedicine[i]?.medicine?.[0]?.name || "Unknown";
      console.log({medicinename})
    }
    res.status(200).json({
      error:true,
      success:false,
      message:"Successfull",
      data:getFeedback
    })

  }catch (error) {
    console.log({ error });
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-getAddedFeedback api`);
  } finally {
    await prisma.$disconnect();
  }
}


///////water remainder notification

const quotes=[
  "Believe you can, and you're halfway there.",
  "Don't watch the clock; do what it does. Keep going.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Success doesn't come from what you do occasionally, but what you do consistently.",
  "Dream it. Believe it. Build it."
]

const addQuotes = async()=>{
  const date =  new Date()
  for(const quote of quotes){
    await prisma.remainder.create({
      data:{
         quotes: quote,
         created_date:date
      }
    })
  }
}
// const getRandomMotivationalQuote = async () => {
//   const totalQuotes = await prisma.motivationalQuotes.count();
//   const randomIndex = Math.floor(Math.random() * totalQuotes);

//   const quote = await prisma.motivationalQuotes.findMany({
//     skip: randomIndex,
//     take: 1,
//   });

//   return quote[0]?.quote || "Stay motivated and keep moving forward!";
// };
// // const schedule = require('node-schedule');

// const sendMotivationalQuote = async () => {
//   try {
//     const quote = await getRandomMotivationalQuote();
//     console.log(`Motivational Quote: ${quote}`);
    
//     // Logic to send the quote to users
//     const users = await prisma.user.findMany(); // Assuming a users table
//     users.forEach(user => {
//       console.log(`Sending to User ${user.id}: ${quote}`);
//       // Add actual notification logic here (e.g., push notifications, email, etc.)
//     });
//   } catch (error) {
//     console.error('Error sending motivational quote:', error);
//   }
// };

// // Schedule at 9:00 AM
// schedule.scheduleJob('0 9 * * *', sendMotivationalQuote);

// // Schedule at 12:00 PM
// schedule.scheduleJob('0 12 * * *', sendMotivationalQuote);

// // Schedule at 6:00 PM
// schedule.scheduleJob('0 18 * * *', sendMotivationalQuote);





// const selectPastOrderMedicine = async(req,res)=>{
//   try{
//     const{userId,status,medicineId} = req.body
    
//     const selectMedicine = await prisma.medicine_timetable.updateMany({
//        where:{
//         userId:userId,
//         medicine:{
//           some:{
//             id:medicineId
//           }
//         },
      
//        },
//        data:{
//         active_status:"true"
//        }
//     })
//     console.log({selectMedicine})
//     // for(let i=0; i<selectMedicine.length; i++){
//     //   const medicineid = selectMedicine[i].medicine[0].id
//     //   console.log({medicineid})
//     //   const addStatus = await prisma.medicine_timetable.findMany({
//     //     where:{
//     //       medicine:medicineId,
//     //       active_status:"true"
//     //     }
//     //   })
//     //   console.log({addStatus})
//     // }
//     res.status(200).json({
//       error:false,
//       success:true,
//       message:"Successfull",
//       data:selectMedicine
//     })

//   }catch (error) {
//     console.log({ error });
//     response.status(500).json(error.message);
//     logger.error(`Internal server error: ${error.message} in medone-selectPastOrderMedicine  api`);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

const selectPastOrderMedicine = async (req, res) => {
  try {
    const { userId, medicineIds } = req.body; 

    if (!Array.isArray(medicineIds) || medicineIds.length === 0) {
      return res.status(400).json({ success: false, message: "medicineIds must be a non-empty array" });
    }

    const medicines = await prisma.medicine_timetable.findMany({
      where: {
        userId: userId,
      },
    });

    const filteredMedicines = medicines.filter((record) =>
      record.medicine.some((med) => medicineIds.includes(med.id)) 
    );

    if (filteredMedicines.length === 0) {
      return res.status(404).json({ success: false, message: "No matching medicines found" });
    }

 
    const medicineIdsToUpdate = filteredMedicines.map((medicine) => medicine.id);

   
    const updateResult = await prisma.medicine_timetable.updateMany({
      where: {
        id: { in: medicineIdsToUpdate },
      },
      data: {
        active_status: "true",
      },
    });

    console.log({updateResult})
    const findUpdatedResult = await prisma.medicine_timetable.findMany({
      where:{
        id: { in: medicineIdsToUpdate },
        active_status:"true"
      }
    })
    console.log({findUpdatedResult})
    for(let i=0; i<findUpdatedResult.length;i++){
      
    }

    return res.status(200).json({
      success: true,
      message: `${updateResult.count} records updated successfully.`,
    });
  } catch (error) {
    console.error({ error });
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await prisma.$disconnect();
  }
};


//////add new schedule////
const addNewSchedule = async (request, response) => {
  try {
    const { userid,timetableId } = request.body;
    process.env.TZ = 'Asia/Kolkata';

    // Fetch user routine
    const findRoutine = await prisma.dailyRoutine.findFirst({
      where: { userId: userid },
    });

    if (!findRoutine) {
      return response.status(404).json({
        error: true,
        success: false,
        message: "User routine not found",
      });
    }

    const routineData = findRoutine.routine;
    const breakfastTimeString = routineData[0].breakfast || null;
    const lunchTimeString = routineData[0].lunch || null;
    const dinnerTimeString = routineData[0].dinner || null;

    if (!breakfastTimeString || !lunchTimeString || !dinnerTimeString) {
      return response.status(400).json({
        error: true,
        success: false,
        message: "Invalid or missing meal times in user's routine",
      });
    }
 
    // Fetch medicine schedule
    const medicineSchedule = await prisma.medicine_timetable.findMany({
      where: 
      { 
        userId: userid,
        id:timetableId,
        active_status:"true"
      },
      select: {
        id: true,
        medicine: true,
        timing: true,
        afterFd_beforeFd: true,
        medicine_type: true,
        startDate: true,
        no_of_days: true,
      },
    });

    if (!medicineSchedule || medicineSchedule.length === 0) {
      return response.status(404).json({
        error: true,
        success: false,
        message: "No medicine schedule found for this user",
      });
    }

    const now = new Date();
    const parseTime = (timeString) => {
      const [hours, minutes] = timeString.split(/[: ]/).map(Number);
      const isPM = timeString.includes("PM");
      const date = new Date();
      date.setHours(isPM && hours !== 12 ? hours + 12 : hours === 12 && !isPM ? 0 : hours, minutes);
      return date;
    };

    const mealTimes = {
      Morning: parseTime(breakfastTimeString),
      lunch: parseTime(lunchTimeString),
      dinner: parseTime(dinnerTimeString),
    };

    let notifications = [];
    for (const medicine of medicineSchedule) {
      const { timing, afterFd_beforeFd, id } = medicine;
      const times = Object.values(timing[0]);

      const startDateObj = new Date(medicine.startDate);
      const numberOfDays = parseInt(medicine.no_of_days, 10);
      const endDate = new Date(startDateObj);
      endDate.setDate(endDate.getDate() + numberOfDays);

      const currentDate = new Date();
      if (currentDate < startDateObj || currentDate > endDate) {
        console.log(`Skipping medicine ID: ${id} as it is out of the active range`);
        continue;
      }

      for (const notifyTime of times) {
        const notifyTimeOfDay = notifyTime.toLowerCase();
         console.log({notifyTimeOfDay})
        // Check if the medicine has already been taken
        const existingTakenRecord = await prisma.medication_records.findFirst({
          where: {
            userId: userid,
            timetable_id: id,
            taken_time: notifyTimeOfDay,
            created_date: {
              gte: new Date(currentDate.toISOString().split("T")[0] + "T00:00:00.000Z"),
              lt: new Date(currentDate.toISOString().split("T")[0] + "T23:59:59.999Z"),
            },
            status: "Taken",
          },
        });

        if (existingTakenRecord) {
          console.log(`Skipping notification for medicine ID: ${id} as it is already taken for ${notifyTimeOfDay}`);
          continue;
        }

        let notificationTime;
        if (notifyTimeOfDay === "morning") {
          notificationTime = afterFd_beforeFd === "before food"
            ? new Date(mealTimes.Morning.getTime() - 45 * 60000)
            : mealTimes.Morning;
        } else if (notifyTimeOfDay === "lunch") {
          notificationTime = afterFd_beforeFd === "before food"
            ? new Date(mealTimes.lunch.getTime() - 45 * 60000)
            : mealTimes.lunch;
        } else if (notifyTimeOfDay === "dinner") {
          notificationTime = afterFd_beforeFd === "before food"
            ? new Date(mealTimes.dinner.getTime() - 45 * 60000)
            : mealTimes.dinner;
        }

        if (notificationTime) {
          const validUntil = new Date(notificationTime.getTime() + 2 * 60 * 60 * 1000);

          if (now <= validUntil) {
            notifications.push({
              medicine_timetableID: id,
              medicine: medicine.medicine[0].name,
              notificationTime: notificationTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
              medicine_type: medicine.medicine_type,
              validUntil: validUntil.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
              timeOfDay: notifyTimeOfDay,
            });
          }
        }
      }
    }
    // Sort notifications by time of day
    notifications.sort((a, b) => {
      const timeOrder = { morning: 1, lunch: 2, dinner: 3 };
      return timeOrder[a.timeOfDay] - timeOrder[b.timeOfDay];
    });


    if (notifications.length === 0) {
      return response.status(404).json({
        error: true,
        success: false,
        message: "No notifications scheduled",
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      message: "Notifications scheduled",
      notifications,
    });
  } catch (error) {
    console.error({ error });
    return response.status(500).json({ error: error.message });
  }
};

//////get medicine for schedule
const getMedicineForSchedule = async(req,res)=>{
  try{
    const {userId} = req.body

    const getMedicine = await prisma.medicine_timetable.findMany({
      where:{
        userId:userId,
        app_flag:false
      }
    })
    console.log({getMedicine})
    res.status(200).json({
      error:false,
      success:true,
      message:"Successfull",
      data:getMedicine
    })

  } catch (error) {
    console.error({ error });
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await prisma.$disconnect();
  }
}

//////get complete medicine
const getCompleteMedicine = async(req,res)=>{
try{
  const {userId} = req.body
  if(!userId){
    return res.status(404).json({
      error:true,
      success:false,
      message:"userId is required.........",
      
    })
  }
  const getCompleteList = await prisma.medicine_timetable.findMany({
    where:{
      userId:userId,
      app_flag:false,
      startDate:{
        not:null
      }
    },
    select:{
      id:true,
      userId:true,
      medicine:true,
      startDate:true,
      no_of_days:true
    }
  })
  console.log({getCompleteList})
   const filteredList = []
  for(let i=0;i<getCompleteList.length;i++){

    const startDateObj = new Date(getCompleteList[i].startDate);
    console.log({startDateObj})
    const numberOfDays = parseInt(getCompleteList[i].no_of_days, 10);
    console.log({numberOfDays})
    const endDate = new Date(startDateObj);
    endDate.setDate(endDate.getDate() + numberOfDays);
    console.log({endDate})


    
    const currentDate = new Date();
    if (currentDate >= startDateObj && currentDate <= endDate) {
      console.log(`Including medicine ID: ${getCompleteList[i].id}`);
      filteredList.push(getCompleteList[i]); // Add the valid medicine to the filtered list
    } else {
      console.log(
        `Skipping medicine ID: ${getCompleteList[i].id} as it is out of the active range`
      );
    }
  
  }
    
  console.log({filteredList})



  if(getCompleteList.length === 0 ){
    return res.status(404).json({
      error:true,
      success:false,
      message:"No medicine found..........",
   
    })
  }

  return res.status(200).json({
    error:false,
    success:true,
    message:"Successfull..........",
    data:filteredList
  })
}catch (error) {
    console.error({ error });
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = {addUserData,
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
  getMedicineAddedByUser,
  addFeedback,
  getAddedFeedback,
  addQuotes,
  selectPastOrderMedicine,
  addNewSchedule,
  // notificationData,
  getMedicineForSchedule,
  getCompleteMedicine
}

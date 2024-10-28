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
// const { use } = require("bcrypt/promises");

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
            weight
        } = request.body
    
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
                weight:weight

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


const addNewMedicine = async(request,response)=>{
  try{
    const currentDate = new Date();
    const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
    const istDate = new Date(currentDate.getTime() + istOffset);
      const {
        name,
        category,
        userId
      } = request.body
      if(name){
        return response.status(200)({
          error:false,
          success:true,
          message:"Medicine already in the list......"
        })
      }
      const addMedicine = await prisma.medicines.create({
        data:{
          name:name,
          status:"Pending",
          created_date:istDate,
          created_by:userId,
          category:category
        }
      })
      console.log({addMedicine})
      response.status(200).json({
        error:false,
        success:true,
        message:"Successfully added the medicine",
        data:addMedicine
      })

  }catch (error) {
    console.log({error})
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-addnewmedicine api`);
  } finally {
    await prisma.$disconnect();
  }
}

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
        created_date:istDate //change to dateTime
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
//       if (time.toLowerCase() === 'morning') return 'Morning';
//       if (time.toLowerCase() === 'lunch') return 'Lunch';
//       if (time.toLowerCase() === 'dinner') return 'Dinner';

//       const [hours] = time.split(':');
//       const hour = parseInt(hours, 10);

//       if (hour >= 5 && hour < 11) return 'Morning';
//       if (hour >= 11 && hour < 17) return 'Lunch';
//       return 'Dinner';
//     };

//     let notifications = [];

//     for (const medicine of medicineSchedule) {
//       const { timing, afterFd_beforeFd, startDate, no_of_days, id } = medicine;

//       if (!timing || !startDate) continue;

//       const startDateObj = new Date(startDate.replace(/\//g, '-'));
//       const numberOfDays = parseInt(no_of_days, 10);
//       const endDate = new Date(startDateObj);
//       endDate.setDate(endDate.getDate() + numberOfDays);

//       let currentDate = new Date();
//       const todayDate = currentDate.toISOString().split('T')[0];

//       const takenRecord = await prisma.medication_records.findFirst({
//         where: {
//           userId: userid,
//           timetable_id: id,
//           status: 'Taken',
//           created_date: {
//             gte: new Date(todayDate + "T00:00:00.000Z"),
//             lt: new Date(todayDate + "T23:59:59.999Z"),
//           },
//         },
//       });

//       if (takenRecord) continue; // Skip if already taken

//       for (const time of timing) {
//         let notificationTime;

//         const timeOfDay = getTimeOfDay(time);
//         if (timeOfDay === "Morning") {
//           const breakfastTime = getRoutineTime(breakfastTimeString);
//           notificationTime = afterFd_beforeFd === "before food"
//             ? new Date(breakfastTime.getTime() - 45 * 60000)
//             : breakfastTime;
//         } else if (timeOfDay === "Lunch") {
//           const lunchTime = getRoutineTime(lunchTimeString);
//           notificationTime = afterFd_beforeFd === "before food"
//             ? new Date(lunchTime.getTime() - 45 * 60000)
//             : lunchTime;
//         } else if (timeOfDay === "Dinner") {
//           const dinnerTime = getRoutineTime(dinnerTimeString);
//           notificationTime = afterFd_beforeFd === "before food"
//             ? new Date(dinnerTime.getTime() - 45 * 60000)
//             : dinnerTime;
//         }

//         if (notificationTime && !isNaN(notificationTime)) {
//           notifications.push({
//             medicine_timetableID: id,
//             medicine: medicine.medicine[0].name,
//             medicine_type: medicine.medicine_type,
//             notificationTime: notificationTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
//             timeOfDay: timeOfDay // Add time of day for sorting
//           });
//         }
//       }
//     }

//     if (notifications.length === 0) {
//       return response.status(404).json({
//         error: true,
//         success: false,
//         message: "No notifications scheduled",
//       });
//     }

//     // Sort notifications by time of day
//     notifications.sort((a, b) => {
//       const timeOrder = { Morning: 1, Lunch: 2, Dinner: 3 };
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
        userId: true,
        medicine: true,
        medicine_type: true,
        startDate: true,
        no_of_days: true,
        afterFd_beforeFd: true,
        totalQuantity: true,
        timing: true,
        timeInterval: true,
        takingQuantity: true,
      },
    });

    if (!medicineSchedule || medicineSchedule.length === 0) {
      return response.status(404).json({
        error: true,
        success: false,
        message: "No medicine schedule found for this user",
      });
    }

    const getRoutineTime = (timeString) => {
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0]; // Get current date
      const convertedTime = convertTime(timeString);
      return new Date(`${dateString}T${convertedTime}:00`);
    };

    const getTimeOfDay = (time) => {
      if (time.toLowerCase() === 'morning') return 'Morning';
      if (time.toLowerCase() === 'lunch') return 'Lunch';
      if (time.toLowerCase() === 'dinner') return 'Dinner';

      const [hours] = time.split(':');
      const hour = parseInt(hours, 10);

      if (hour >= 5 && hour < 11) return 'Morning';
      if (hour >= 11 && hour < 17) return 'Lunch';
      return 'Dinner';
    };

    let notifications = [];

    for (const medicine of medicineSchedule) {
      const { timing, afterFd_beforeFd, startDate, no_of_days, id } = medicine;

      if (!timing || !startDate) continue;

      const startDateObj = new Date(startDate.replace(/\//g, '-'));
      const numberOfDays = parseInt(no_of_days, 10);
      const endDate = new Date(startDateObj);
      endDate.setDate(endDate.getDate() + numberOfDays);

      let currentDate = new Date();
      const todayDate = currentDate.toISOString().split('T')[0];

      for (const time of timing) {
        const timeOfDay = getTimeOfDay(time);
        
        console.log({timeOfDay})
        // Check if the medicine was already taken for this specific time of day
        const takenRecord = await prisma.medication_records.findFirst({
          where: {
            userId: userid,
            timetable_id: id,
            status: 'Taken',
            taken_time: timeOfDay, // Check if it's taken for this specific time (Morning/Lunch/Dinner)
            created_date: {
              gte: new Date(todayDate + "T00:00:00.000Z"),
              lt: new Date(todayDate + "T23:59:59.999Z"),
            },
          },
        });
        console.log({takenRecord}) // getting the takenRecord as null
        

        if (takenRecord) {
          console.log(`Medicine already taken for ${timeOfDay} time`);
          continue; // Skip if already taken for this specific time
        }

        let notificationTime;

        if (timeOfDay === "Morning") {
          const breakfastTime = getRoutineTime(breakfastTimeString);
          notificationTime = afterFd_beforeFd === "before food"
            ? new Date(breakfastTime.getTime() - 45 * 60000)
            : breakfastTime;
        } else if (timeOfDay === "Lunch") {
          const lunchTime = getRoutineTime(lunchTimeString);
          notificationTime = afterFd_beforeFd === "before food"
            ? new Date(lunchTime.getTime() - 45 * 60000)
            : lunchTime;
        } else if (timeOfDay === "Dinner") {
          const dinnerTime = getRoutineTime(dinnerTimeString);
          notificationTime = afterFd_beforeFd === "before food"
            ? new Date(dinnerTime.getTime() - 45 * 60000)
            : dinnerTime;
        }

        if (notificationTime && !isNaN(notificationTime)) {
          notifications.push({
            medicine_timetableID: id,
            medicine: medicine.medicine[0].name,
            medicine_type: medicine.medicine_type,
            notificationTime: notificationTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            timeOfDay: timeOfDay // Add time of day for sorting
          });
        }
      }
    }

    if (notifications.length === 0) {
      return response.status(404).json({
        error: true,
        success: false,
        message: "No notifications scheduled",
      });
    }

    // Sort notifications by time of day
    notifications.sort((a, b) => {
      const timeOrder = { Morning: 1, Lunch: 2, Dinner: 3 };
      return timeOrder[a.timeOfDay] - timeOrder[b.timeOfDay];
    });

    return response.status(200).json({
      error: false,
      success: true,
      message: "Notifications scheduled",
      notifications: notifications,
    });

  } catch (error) {
    console.error({ error });
    return response.status(500).json({ error: error.message });
  }
};







// Helper function to convert 12-hour AM/PM time to 24-hour format
// const convertTime = (timeString) => {
//   if (!timeString || typeof timeString !== 'string') {
//     console.error("Invalid time string:", timeString);
//     return null;
//   }

//   const [time, modifier] = timeString.split(' ');
//   let [hours, minutes] = time.split(':');

//   if (hours === '12') {
//     hours = '00'; // Handle 12:00 AM as midnight
//   }

//   if (modifier === 'PM' && hours !== '00') {
//     hours = String(parseInt(hours, 10) + 12); // Convert PM times to 24-hour format
//   }

//   return `${hours.padStart(2, '0')}:${minutes}`;
// };
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
  try{
    const{
         userId,
         timetableId,
         status,
         takenTime,
         takenStatus
        } = request.body
    const date = new Date()
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
  }catch(err){
    console.log({err})
    response.status(404).json({
      error:true,
      success:false,
      message:"Internal server error"
    })
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
    return response.status(200).json({
      error:false,
      success:true,
      message:"Successfull",
      data:medicationHistory
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
          taken_status:"Taken"
        },
        
      })
      console.log({medicationData})

      const remainingQuantity = quantity - medicationData
      console.log({remainingQuantity})
      if (remainingQuantity <= 3) {
        notifications.push({
          medicineId: timeTable_id,
          message: `Refill needed for medicine ${findMedicines[i].medicine[0].name}, only 25% remaining.`,
        });
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
  refillNotification
}
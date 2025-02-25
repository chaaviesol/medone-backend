const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
// const logDirectory = "./logs";
const winston = require("winston");
const bcrypt = require('bcrypt');
const moment = require('moment');
const geolib = require('geolib')
const {
  getCurrentDateInIST,
  istDate,
  logger,
 decrypt,
} = require("../../utils");


// const logger = winston.createLogger({
//     level: "info",
//     format: winston.format.combine(
//       winston.format.timestamp(),
//       winston.format.json()
//     ),
//     transports: [
//       new winston.transports.File({
//         filename: `${logDirectory}/error.log`,
//         level: "error",
//       }),
//       new winston.transports.File({ filename: `${logDirectory}/combined.log` }),
//     ],
//   });

//////api for login////////////
const assist_login = async (req, res) => {
    const { userid, password } = req.body;
    if (!userid || !password) {
      res.status(400).json({
        error: true,
        message: "userid and password are required",
      });
    } else {
      try {
        let user;
        let identifier;
  
      
          identifier = "mobile";

         if(identifier === "mobile") {
          user = await prisma.assist_details.findFirst({
            where: {
              phone_no: userid,
            },
          });
        }
        if (!user) {
          res.status(400).json({
            error: true,
            message: "user not found",
          });
        } else {
          const hashedpassword = user.password;
          console.log({hashedpassword})
          console.log({ password, hashedpassword });

          bcrypt.compare(password, hashedpassword, function (err, result) {
            if (err) {
              res.status(500).json({
                error: true,
                message: "password hashing error",
              });
            } else {
              if (!result) {
                res.status(400).json({
                  error: false,
                  message: "invaild password",
                });
              } else {
                res.status(200).json({
                  error: false,
                  success: true,
                  message: "successfully logged in",
                  data: user,
                });
              }
            }
          });
        }
      } catch (err) {
        logger.error(
          `Internal server error: ${err.message} in driver_login api`,
          console.log({err})
        );
        res.status(400).json({
          error: true,
          message: "internal server error",
        });
      }
    }
  };


//////api for profile//////
const getAssist_profile = async(req,res)=>{
  try{
    const{assistId} = req.body
    if(!assistId){
      return res.status(404).json({
        error:true,
        success:false,
        message:"assist id is required.........."
      })
    }
      const getProfile = await prisma.assist_details.findUnique({
        where:{
          id:assistId
        }
      })
      console.log({getProfile})
      if(!getProfile){
        return res.status(404).json({
          error:true,
          success:false,
          message:"assist not found.........."
        })
      }
    return res.status(200).json({
      error:false,
      success:true,
      message:"Successfull......",
      data:getProfile
    })


  }catch (err) {
        logger.error(
          `Internal server error: ${err.message} in getAssist_profile api`,
          console.log({err})
        );
        res.status(400).json({
          error: true,
          message: "internal server error",
        });
      }
}


/////get daily task/////////////
// const getTask = async (req, res) => {
//   try {
//       const { assistId, type } = req.body;
//       let task = [];

//       if (type === "nurse") {
//           const hospitalTask = await prisma.hospitalAssist_service.findMany({
//               where: {
//                   assist_id: assistId,
//                   status: "confirmed"
//               }
//           });

//           const homecareTask = await prisma.homeCare_Service.findMany({
//               where: {
//                   assist_id: assistId,
//                   status: "confirmed"
//               }
//           });

//           task = [...homecareTask, ...hospitalTask];
//       } else {
//           task = await prisma.physiotherapist_service.findMany({
//               where: {
//                   assist_id: assistId,
//                   status: "confirmed"
//               }
//           });
//       }

//       console.log("Raw Task Data:", JSON.stringify(task, null, 2));

//       const currentDate = moment().format('DD-MM-YYYY');

//       // Function to generate all dates between start_date and end_date
//       const getDatesInRange = (startDate, endDate) => {
//           let dates = [];
//           let current = moment(startDate, 'DD-MM-YYYY');
//           let lastDate = moment(endDate, 'DD-MM-YYYY');

//           while (current <= lastDate) {
//               dates.push(current.format('DD-MM-YYYY'));
//               current.add(1, 'days');
//           }

//           return dates;
//       };

//       // Filtering tasks based on the type condition
//       const filteredTasks = task.filter(t => {
//           if (!t.start_date) return false; // Ignore tasks without a start_date

//           // Trim and validate date strings
//           const startDateStr = t.start_date.toString().trim();
//           const endDateStr = t.end_date ? t.end_date.toString().trim() : null;

//           const startDate = moment(startDateStr, 'DD-MM-YYYY', true);
//           const endDate = endDateStr ? moment(endDateStr, 'DD-MM-YYYY', true) : startDate;

//           if (!startDate.isValid() || (endDateStr && !endDate.isValid())) {
//               console.warn(`Invalid date format for task ID ${t.id}: ${startDateStr} - ${endDateStr}`);
//               return false;
//           }

//           if (type === "nurse") {
//               // Nurse: Check if current date falls within start_date to end_date range
//               return moment(currentDate, 'DD-MM-YYYY').isBetween(startDate, endDate, null, '[]');
//           } else {
//               // Physiotherapist: Check only the start_date
//               return startDate.format('DD-MM-YYYY') === currentDate;
//           }
//       });

//       console.log("Filtered Tasks:", filteredTasks);

//       res.status(200).json({
//           error: false,
//           success: true,
//           message: "Successful",
//           data: filteredTasks
//       });

//   } catch (err) {
//       logger.error(`Internal server error: ${err.message} in getTask API`);
//       console.error("Error in getTask API:", err);

//       res.status(500).json({
//           error: true,
//           message: "Internal server error",
//       });
//   }
// };
const getTask = async (req, res) => {
  try {
    const { assistId, type } = req.body;
    let task = [];

    // Fetch tasks based on type (nurse includes hospital & homecare)
    const hospitalTask = await prisma.hospitalAssist_service.findMany({
      where: { assist_id: assistId, status: "confirmed" }
    });

    const homecareTask = await prisma.homeCare_Service.findMany({
      where: { assist_id: assistId, status: "confirmed" }
    });

    const physiotherapyTask = await prisma.physiotherapist_service.findMany({
      where: { assist_id: assistId, status: "confirmed" }
    });

    if (type === "nurse") {
      task = [...homecareTask, ...hospitalTask];
    } else if (type === "physiotherapist") {
      task = physiotherapyTask;
    } else {
      task = [...homecareTask, ...hospitalTask, ...physiotherapyTask]; // Include both nurse and physiotherapy tasks
    }

    console.log("Raw Task Data:", JSON.stringify(task, null, 2));

    const currentDate = moment().format('DD/MM/YYYY');
    console.log({ currentDate });

    // Fetch check-in & check-out records
    const attendanceRecords = await prisma.assist_taskattendance.findMany({
      where: {
        assist_id: assistId,
        date: currentDate
      },
      select: {
        task_id: true,
        checkin: true,
        checkout: true
      }
    });

    console.log({ attendanceRecords });

    // Store task IDs based on check-in and check-out
    const checkInTaskIds = new Set();
    const checkOutTaskIds = new Set();

    attendanceRecords.forEach(record => {
      if (record.checkin) checkInTaskIds.add(record.task_id);
      if (record.checkout) checkOutTaskIds.add(record.task_id);
    });

    // Filtering tasks based on date conditions and attendance
    const filteredTasks = task.filter(t => {
      if (!t.start_date) return false;

      // Trim and validate date strings
      const startDateStr = t.start_date.toString().trim();
      const endDateStr = t.end_date ? t.end_date.toString().trim() : null;

      const startDate = moment(startDateStr, 'DD-MM-YYYY', true);
      const endDate = endDateStr ? moment(endDateStr, 'DD-MM-YYYY', true) : startDate;

      if (!startDate.isValid() || (endDateStr && !endDate.isValid())) {
        console.warn(`Invalid date format for task ID ${t.id}: ${startDateStr} - ${endDateStr}`);
        return false;
      }

      // Exclude tasks that have a checkout record
      if (checkOutTaskIds.has(t.id)) {
        console.log(`Skipping task ID ${t.id} due to checkout`);
        return false;
      }

      // Include tasks that have a check-in but no checkout
      if (checkInTaskIds.has(t.id)) {
        console.log(`Including task ID ${t.id} due to check-in`);
        return true;
      }

      return moment(currentDate, 'DD-MM-YYYY').isBetween(startDate, endDate, null, '[]');
    });

    console.log("Filtered Tasks:", filteredTasks);

    res.status(200).json({
      error: false,
      success: true,
      message: "Successful",
      data: filteredTasks
    });

  } catch (err) {
    logger.error(`Internal server error: ${err.message} in getTask API`);
    console.error("Error in getTask API:", err);

    res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};





////apply leave////////
const applyLeave_assist = async (req, res) => {
    console.log("jjjjjjj")
    try{
        const{assist_id,
              leave_type,
              remarks,
              fromdate,
              todate
            } = req.body
        const date = new Date()

        // if(!assist_id && !leave_type && !remarks && !fromdate && !todate){
        //     return res.status(400).json({
        //         error:true,
        //         success:false,
        //         message:"missing fields.......",
                
        //     })
        // }
        const from_dates = req.body.fromdate;
        const to_dates = req.body.todate

        const start_date = moment(from_dates, 'DD-MM-YYYY', 'en');
        const end_date = moment(to_dates, 'DD-MM-YYYY', 'en');

        if (start_date.isSame(end_date, 'day')) {
            res.status(400).json({
                error: true,
                success: false,
                message: 'The chosen dates are identical.'
            });
            return;
        }


        if (start_date.isValid() && end_date.isValid()) {
            const totalDays = Math.abs(end_date.diff(start_date, 'days'));
            console.log("Days:", totalDays);

        const applyLeave = await prisma.assist_leave.create({
            data:{
                assist_id:assist_id,
                leave_type:leave_type,
                status:"requested",
                created_by:assist_id,
                remarks:remarks,
                from_date:start_date,
                to_date:end_date,
                total_days:totalDays,
                created_date:date
            }
        })
        console.log({applyLeave})
       return res.status(200).json({
            error: false,
            success: true,
            message: 'Successfully applied for leave.....',
            data:applyLeave
        });
    }
    }catch (err) {
        logger.error(`Internal server error: ${err.message} in applyLeave_assist API`);
        console.log({ err });

        res.status(400).json({
            error: true,
            message: "Internal server error",
        });
    }

    
}


////checkin//////
const assist_checkin = async(req,res) =>{
  console.log({req})
    try{
        const{assistId,taskId,type,patient_name,latitude,longitude} = req.body
        const currentDate = new Date();
        const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
        const istDate = new Date(currentDate.getTime() + istOffset);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();
        const dateOnly = new Date(year, month - 1, day);
        const dateOnlyString = dateOnly.toLocaleDateString('en-GB')
        let findTask = []
        if(type === "nurse"){
            const hospital = await prisma.hospitalAssist_service.findMany({
                where:{
                    patient_name:patient_name,
                    id:taskId,
                    assist_id:assistId,
                  
                },
                select:{
                    pickup_type:true,
                    patient_location:true,
                    hospital_location:true
                }
            })
            console.log({hospital})

            const hospitalLocation = hospital.map(task=>{
              return{
                  location:task.pickup_type === "door_to_door" ? task.patient_location : task.hospital_location
              }
          })

            const home = await prisma.homeCare_Service.findMany({
                where:{
                    patient_name:patient_name,
                    id:taskId,
                    assist_id:assistId,
                },
                select:{
                 patient_location:true
                 }
            })
            const homeLocations = home.map(task => ({
              location: task.patient_location
          }));
          console.log({homeLocations})
            

            findTask = [...hospitalLocation,...homeLocations]
        }else{
            findTask = await prisma.physiotherapist_service.findMany({
              where:{
                patient_name:patient_name,
                id:taskId,
                assist_id:assistId,
              },
              select:{
              patient_location:true
              } 
            })
            findTask = findTask.map(task => ({
              location: task.patient_location
            }));
        }
        console.log({findTask})
        
        
        const locationData = findTask[0].location
        console.log({locationData})

        const targetlatitude = locationData[0].latitude
        console.log({targetlatitude})
        const targetlongitude = locationData[0].longitude
        console.log({targetlongitude})

        const maxDistance = 1360000 //given in meters
        const distance = geolib.getDistance(
            { latitude, longitude },
            { latitude: targetlatitude, longitude: targetlongitude }
        )

        if (distance <= maxDistance) {
             const checkin_info = await prisma.assist_taskattendance.create({
                data: {
                    assist_id: assistId,
                    date: dateOnlyString,
                    checkin: istDate,
                    task_id:taskId

                }
            })
           return res.status(200).json({
                error: false,
                success: true,
                message: "checkin time added",
                data: checkin_info
            })
        } else {
            return res.status(400).json({
                error: true,
                message: "you are not within the allowed distance"
            })
        }

    
    }catch (err) {
        logger.error(`Internal server error: ${err.message} in assist_checkin API`);
        console.log({ err });

        res.status(400).json({
            error: true,
            message: "Internal server error",
        });
    }
}

/////checkout//////
const assist_checkout = async(req,res)=>{
    try{
        const{assistId,taskId,type,patient_name,latitude,longitude,attendanceId} = req.body
        const currentDate = new Date();
        const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
        const istDate = new Date(currentDate.getTime() + istOffset);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();
        const dateOnly = new Date(year, month - 1, day);
        const dateOnlyString = dateOnly.toLocaleDateString('en-GB')
        let findTask = []
        if(type === "nurse"){
            const hospital = await prisma.hospitalAssist_service.findMany({
                where:{
                    patient_name:patient_name,
                    id:taskId,
                    assist_id:assistId,
                  
                },
                select:{
                    pickup_type:true,
                    patient_location:true,
                    hospital_location:true
                }
            })
            console.log({hospital})

            const hospitalLocation = hospital.map(task=>{
              return{
                  location:task.pickup_type === "door_to_door" ? task.patient_location : task.hospital_location
              }
          })

            const home = await prisma.homeCare_Service.findMany({
                where:{
                    patient_name:patient_name,
                    id:taskId,
                    assist_id:assistId,
                },
                select:{
                 patient_location:true
                 }
            })
            const homeLocations = home.map(task => ({
              location: task.patient_location
          }));
          console.log({homeLocations})
            

            findTask = [...hospitalLocation,...homeLocations]
        }else{
            findTask = await prisma.physiotherapist_service.findMany({
              where:{
                patient_name:patient_name,
                id:taskId,
                assist_id:assistId,
              },
              select:{
              patient_location:true
              } 
            })
            findTask = findTask.map(task => ({
              location: task.patient_location
            }));
        }
        console.log({findTask})

        const locationData = findTask[0].location
        console.log({locationData})

        const targetlatitude = locationData[0].latitude
        console.log({targetlatitude})
        const targetlongitude = locationData[0].longitude
        console.log({targetlongitude})

        const maxDistance = 1360000//given in meters
        const distance = geolib.getDistance(
            { latitude, longitude },
            { latitude: targetlatitude, longitude: targetlongitude }
        )

        if (distance <= maxDistance) {
             const checkout_info = await prisma.assist_taskattendance.update({
                where:{
                   id: attendanceId
                },
                data: {
             
                    checkout: istDate,
                 

                }
            })

            console.log({checkout_info})

            const checkinTime = checkout_info.checkin
            console.log({checkinTime})
            const checkoutTime = checkout_info.checkout
            console.log({checkoutTime})

            const time_interval = checkoutTime - checkinTime
            const total_hours = time_interval / (1000 * 60 * 60)
            // const total_interval = total_hours * 3600
            console.log({total_hours})

            const updateWorkingHours = await prisma.assist_taskattendance.update({
                where:{
                    id: attendanceId
                 },
                 data: {
              
                     total_interval: total_hours,
                   }
            })


           return res.status(200).json({
                error: false,
                success: true,
                message: "checkout time added",
                data: updateWorkingHours
            })
        } else {
            return res.status(400).json({
                error: true,
                message: "you are not within the allowed distance"
            })
        }

    
    }catch (err) {
        logger.error(`Internal server error: ${err.message} in assist_checkout API`);
        console.log({ err });

        res.status(400).json({
            error: true,
            message: "Internal server error",
        });
    }
}


/////working hours/////
const assistWorkingHours = async(req,res)=>{
    try{
        const {assistId } = req.body

        if(!assistId){
          return  res.status(200).json({
                error: true,
                success:false,
                message: "Id is required",
            });
        }
        const getWorkingHours = await prisma.assist_taskattendance.findMany({
            where:{
                assist_id:assistId
            }
        })
        console.log({getWorkingHours})
        return res.status(200).json({
            error: false,
            success:true,
            message:"Successfull.....",
            data:getWorkingHours
        });

    }catch (err) {
        logger.error(`Internal server error: ${err.message} in assistWorkingHours API`);
        console.log({ err });

        res.status(400).json({
            error: true,
            message: "Internal server error",
        });
    }
}



////completed task
const completedTask = async (req, res) => {
  try {
    const { assistId } = req.body;

    const assistDetails = await prisma.assist_details.findFirst({
      where: {
        id: assistId,
      },
      select: {
        type: true,
      },
    });

    if (!assistDetails) {
      return res.status(404).json({
        error: true,
        success: false,
        message: "Assist details not found.",
      });
    }

    console.log({ assistDetails });
    const type = assistDetails.type;
    console.log({ type });

    let taskData = [];

    if (type === "nurse") {
      const hospital = await prisma.hospitalAssist_service.findMany({
        where: {
          assist_id: assistId,
        },
        select: {
          start_date: true,
          end_date: true,
          id: true,
          patient_name: true,
        },
      });

      const home = await prisma.homeCare_Service.findMany({
        where: {
          assist_id: assistId,
        },
        select: {
          start_date: true,
          end_date: true,
          id: true,
          patient_name: true,
        },
      });

      taskData = [...hospital, ...home];
    } else {
      taskData = await prisma.physiotherapist_service.findMany({
        where: {
          assist_id: assistId,
        },
        select: {
          start_date: true,
          id: true,
          patient_name: true,
        },
      });
    }

    const find_in_outDetails = await prisma.assist_taskattendance.findMany({
      where: {
        assist_id: assistId,
      },
    });

    console.log({ find_in_outDetails });

    // Filter records with both check-in and check-out
    const filteredData = find_in_outDetails
      .filter((item) => item.checkin && item.checkout)
      .map((attendance) => {
        // Find matching patient_name from taskData
        const task = taskData.find((task) => task.id === attendance.task_id);
        return {
          ...attendance,
          patient_name: task ? task.patient_name : "Unknown", // Assign patient name if found, otherwise "Unknown"
        };
      });

    if (filteredData.length > 0) {
      return res.status(200).json({
        error: false,
        success: true,
        message: "Successfully retrieved records.",
        data: filteredData,
      });
    } else {
      return res.status(200).json({
        error: false,
        success: true,
        message: "No records found with both check-in and check-out.",
        data: [],
      });
    }
  } catch (err) {
    logger.error(`Internal server error: ${err.message} in completedTask API`);
    console.log({ err });

    res.status(400).json({
      error: true,
      message: "Internal server error",
    });
  }
};



//////leave history//////
const leave_history = async(req,res)=>{
  try{
    const{assistId} = req.body
    if(!assistId){
      return res.status(400).json({
        error: true,
        success:false,
        message:"assist_id is required.......",
    
      });
    }
    const history = await prisma.assist_leave.findMany({
      where:{
        assist_id:assistId
      }
    })
    console.log(history)
    return res.status(200).json({
      error: false,
      success:true,
      message:"Successfull.......",
      data:history
    });

  }catch (err) {
        logger.error(`Internal server error: ${err.message} in leave_history API`);
        console.log({ err });

        res.status(400).json({
            error: true,
            message: "Internal server error",
        });
    }
}

////upcomming task///
const upcommingTask = async (req, res) => {
  try {
    const { assistId, type } = req.body;
    let task = [];

    if (type === "nurse") {
      const hospitalTask = await prisma.hospitalAssist_service.findMany({
        where: { assist_id: assistId, status: "confirmed" }
      });

      const homecareTask = await prisma.homeCare_Service.findMany({
        where: { assist_id: assistId, status: "confirmed" }
      });

      task = [...homecareTask, ...hospitalTask];
    } else {
      task = await prisma.physiotherapist_service.findMany({
        where: { assist_id: assistId, status: "confirmed" }
      });
    }

    console.log({ task });

    // Get tomorrow's date in the same format as start_date
    const tomorrowDate = moment().add(1, "days").format("DD-MM-YYYY");

    const filteredTasks = task.filter(t => {
      const startDate = moment(t.start_date, "DD-MM-YYYY", true);
      const endDate = t.end_date ? moment(t.end_date, "DD-MM-YYYY", true) : startDate; // Handle cases where end_date is missing
      const tomorrow = moment(tomorrowDate, "DD-MM-YYYY", true);

      console.log(`Checking Task ID: ${t.id}`, {
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
        tomorrow: tomorrow.format("YYYY-MM-DD")
      });

      return tomorrow.isBetween(startDate, endDate, null, "[]");
    });

    console.log("Filtered Tasks:", filteredTasks);

    res.status(200).json({
      error: false,
      success: true,
      message: "Successful......",
      data: filteredTasks
    });

  } catch (err) {
    console.error(`Internal server error: ${err.message} in getTask API`);

    res.status(400).json({
      error: true,
      message: "Internal server error",
    });
  }
};



const addToken = async(request,response)=>{
  try{
    const{
      id,
      token
    } = request.body
    const findserviceUser = await prisma.assist_details.findFirst({
      where:{
        id:id
      }
    })
    console.log({findserviceUser})
  
    const addServicetoken = await prisma.assist_details.update({
      where:{
        id:id
      },
      data:{
        token:token
      }
    })
    console.log({addServicetoken})
    return response.status(200).json({
      error:false,
      success:true,
      message:"successfully added token",
      data:addServicetoken
    })
  

  }catch (error) {
    console.log({ error });
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in driver-addToken api`);
  } finally {
    //await prisma.$disconnect();
  }
}








module.exports = {assist_login,
    getAssist_profile,
    getTask,
    applyLeave_assist,
    assist_checkin,
    assist_checkout,
    assistWorkingHours,
    completedTask,
    leave_history,
    upcommingTask,
    addToken
}















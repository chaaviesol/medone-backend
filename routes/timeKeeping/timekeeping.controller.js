const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const logDirectory = "./logs";
const winston = require("winston");
const bcrypt = require('bcrypt');
const moment = require('moment');



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
const getTask = async (req, res) => {
    try {
        const { assistId, type } = req.body;
        let task = [];

        if (type === "nurse") {
            const hospitalTask = await prisma.hospitalAssist_service.findMany({
                where: {
                    assist_id: assistId,
                    status: "placed"
                }
            });

            const homecareTask = await prisma.homeCare_Service.findMany({
                where: {
                    assist_id: assistId,
                    status: "placed"
                }
            });

            task = [...homecareTask, ...hospitalTask];
        } else {
            task = await prisma.physiotherapist_service.findMany({
                where: {
                    assist_id: assistId,
                    status: "placed"
                }
            });
        }

        console.log({ task });

        const currentDate = moment().format('DD-MM-YYYY');

        // Filtering tasks based on date range only once
        const filteredTasks = task.filter(t => {
            const startDate = moment(t.start_date, 'DD-MM-YYYY');
            const endDate = moment(t.end_date, 'DD-MM-YYYY');
            const today = moment(currentDate, 'DD-MM-YYYY');

            return today.isBetween(startDate, endDate, null, '[]');
        });

        console.log("Filtered Tasks:", filteredTasks);

        res.status(200).json({
            error: false,
            success: true,
            message: "successful......",
            data: filteredTasks  // Directly returning the filtered tasks instead of nesting them inside another array
        });

    } catch (err) {
        logger.error(`Internal server error: ${err.message} in getTask API`);
        console.log({ err });

        res.status(400).json({
            error: true,
            message: "Internal server error",
        });
    }
};




















module.exports = {assist_login,
    getAssist_profile,
    getTask
}















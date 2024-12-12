const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const logDirectory = "./logs";
const winston = require("winston");
const bcrypt = require('bcrypt')




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


//////driver login///////
const driver_login = async (req, res) => {
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
  
        const emailformat = /^[^\s@]+@gmail\.com$/.test(userid);
        if (emailformat) {
          identifier = "email";
        }
        //  else {
        //   identifier = "mobile";
        // }
        if (identifier === "email") {
          user = await prisma.delivery_partner.findFirst({
            where: {
              email: userid,
            },
          });
        // } else {
        //   user = await prisma.delivery_partner.findFirst({
        //     where: {
        //       phone_no: userid,
        //     },
          // });
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


///driver profile////////////
const getDriver_profile = async(req,res)=>{
  try{
    const{driverId} = req.body
    if(!driverId){
      return res.status(404).json({
        error:true,
        success:false,
        message:"driver id is required.........."
      })
    }
      const getProfile = await prisma.delivery_partner.findUnique({
        where:{
          id:driverId
        }
      })
      console.log({getProfile})
      if(!getProfile){
        return res.status(404).json({
          error:true,
          success:false,
          message:"driver not found.........."
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
          `Internal server error: ${err.message} in getDriver_profile api`,
          console.log({err})
        );
        res.status(400).json({
          error: true,
          message: "internal server error",
        });
      }
}

////get order///////
const getorder = async(req,res)=>{
  try{
    const {driverId} = req.body
    if(!driverId){
      return res.status(404).json({
        error:true,
        success:false,
        message:"driver id is required.........."
      })
    }
    const findOrders = await prisma.delivery_assign.findMany({
      where:{
        deliverypartner_id:driverId,
        status:"assigned"
      },
      select:{
        id:true,
        sales_id:true,
        deliverypartner_id:true,
        status:true,
        assigned_date:true
      }
    })
    console.log({findOrders})
    if(!findOrders){
      
    }
    return res.status(200).json({
      error:false,
      success:true,
      message:"Successfull......",
      data:findOrders
    })


  } catch (err) {
        logger.error(
          `Internal server error: ${err.message} in getorder api`,
          console.log({err})
        );
        res.status(400).json({
          error: true,
          message: "internal server error",
        });
      }
}
















  module.exports = {driver_login,
    getDriver_profile,
    getorder
  }
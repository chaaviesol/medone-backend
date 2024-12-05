const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const logDirectory = "./logs";
const winston = require("winston");
const bcrypt = require("bcrypt");
const { messaging } = require("firebase-admin");




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


//////login for pharmacy/////
const chemist_login = async (req, res) => {
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
        } else {
          identifier = "mobile";
        }
        if (identifier === "email") {
          user = await prisma.pharmacy_details.findFirst({
            where: {
              email: userid,
            },
          });
        } else {
          user = await prisma.pharmacy_details.findFirst({
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
          `Internal server error: ${err.message} in pharmacy_login api`
        );
        res.status(400).json({
          error: true,
          message: "internal server error",
        });
      }
    }
  };



///add chemist/////
const addChemist = async(req,res)=>{
  try{
    const {
      name ,                    
      phone_no ,             
      address ,                 
      lisence_no ,             
                    
      email   ,                 
      password ,               
      pincode  ,               
      created_by 
    } = req.body
    const date = new Date()
    const hashedpassword = await bcrypt.hash(password, 10);
    const chemist = await prisma.pharmacy_details.create({
      data:{
        name:name,
        phone_no:phone_no,
        address:address,
        email:email,
        password:hashedpassword,
        pincode:pincode,
        lisence_no:lisence_no,
        created_by:created_by,
        datetime:date
      }
    })
    console.log({chemist})
    res.status(200).json({
      error:false,
      success:true,
      message:Successfull,
      data:chemist
    })
  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in addChemist api`
    );
    res.status(400).json({
      error: true,
      message: "internal server error",
    });
  }
}

//////pharmacy profile////
const chemist_profile = async(req,res)=>{
  try{
    const {chemistId} = req.body
     if(!chemistId){
      return res.status(200).json({
        error:true,
        success:false,
        message:"chemist id is required..........."
      })
     }
    const findchemist = await prisma.pharmacy_details.findUnique({
      where:{
        id:chemistId
      }
    })
    console.log({findchemist})
    return res.status(200).json({
      error:false,
      success:true,
      message:"successfull.......",
      data:findchemist
    })
  }catch (err) {
    logger.error(
      `Internal server error: ${err.message} in chemist_profile api`
    );
    res.status(400).json({
      error: true,
      message: "internal server error",
    });
  }
}

/////get complete order////
const getOrder = async(req,res)=>{
try{
  const{chemistId} = req.body
  if(!chemistId){
    return res.status(200).json({
      error:true,
      success:false,
      message:"chemist id is required..........."
    })
   }
  const getCompleteOrder = await prisma.pharmacyquotation.findMany({
    where:{
      pharmacy_id:chemistId,
      status:"requested"
    }
  })
  console.log({getCompleteOrder})
  const order = []
  for(let i=0;i<getCompleteOrder.length;i++){
    const salesId = getCompleteOrder[i].sales_id
    console.log({salesId})

    const getSaleslist = await prisma.sales_list.findMany({
      where:{
        sales_id:salesId
      }
    })
    console.log({getSaleslist})
    order.push({
      ...getCompleteOrder[i],
      productlist:getSaleslist
    })
  }
  if(getCompleteOrder.length === 0){
    return res.status(404).json({
      error:true,
      success:false,
      message:"No order found........"
    })

  }
  res.status(200).json({
    error:false,
    success:true,
    message:"Successfull",
    data:order
  })
} catch (err) {
    logger.error(
      `Internal server error: ${err.message} in getorder api`
    );
    res.status(400).json({
      error: true,
      message: "internal server error",
    });
  }
}

///////order accept/reject /////
const orderResponse = async(req,res)=>{
  try{
    const {quotationId,status} = req.body
   if(quotationId && status){
    const addResponse = await prisma.pharmacyquotation.updateMany({
      where:{
        id:quotationId
      },
      data:{
        status:status
      }
    })
    console.log({addResponse})
    return res.status(200).json({
      error:false,
      success:true,
      message:"Successfull",
      data:addResponse
    })
  }else{
    return res.status(400).json({
      error:true,
      success:false,
      message:"both quotation id and status are required"
    })
  }

  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in getorder api`
    );
    res.status(400).json({
      error: true,
      message: "internal server error",
    });
  }
}

const getConfirmedOrder = async(req,res)=>{
  try{
    const{chemistId,status} = req.body
    const getorder = await prisma.pharmacyquotation.findMany({
      where:{
        pharmacy_id:chemistId,
        status:{
          in:["Packed","Accepted","ready to ship"]
        }
      }
    })
    console.log({getorder})
    const orders = []
    for(let i=0;i<getorder.length;i++){
      const salesId = getorder[i].sales_id
      console.log({salesId})
      const getOrder = await prisma.sales_list.findMany({
        where:{
          sales_id:salesId
        }
      })
      console.log({getOrder})
      orders.push({
        ...getorder[i],
        productlist:getOrder
      })
    }
    res.status(200).json({
      error:false,
      success:true,
      message:"Successfull",
      data:orders
    })

  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in getconfirmedOrder api`
    );
    res.status(400).json({
      error: true,
      message: "internal server error",
    });
  }
}



module.exports = {
    chemist_login,
    addChemist,
    chemist_profile,
    getOrder,
    orderResponse,
    getConfirmedOrder
}
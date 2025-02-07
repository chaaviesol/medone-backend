const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const logDirectory = "./logs";
const winston = require("winston");
const {getCurrentDateInIST} = require('../../utils');



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

const bcrypt = require("bcrypt");

const phlebo_login = async (req, res) => {
  const { phone, password } = req.body;

  try {
    console.log({ phone, password });

    // Find user in the database
    const findUser = await prisma.phlebo_details.findFirst({
      where: 
      { phone: phone },
    });

    if (!findUser) {
      return res.status(404).json({
        error: true,
        success: false,
        message: "User not found.",
      });
    }

    const hashedPassword = findUser.password; // Retrieve stored hashed password
    console.log({ password, hashedPassword });

    // Compare passwords
    bcrypt.compare(password, hashedPassword, (err, result) => {
      if (err) {
        return res.status(500).json({
          error: true,
          success: false,
          message: "Password hashing error.",
        });
      }

      if (!result) {
        return res.status(400).json({
          error: true,
          success: false,
          message: "Invalid password.",
        });
      }

      return res.status(200).json({
        error: false,
        success: true,
        message: "Successfully logged in.",
        data: findUser,
      });
    });
  } catch (err) {
    console.error(`Internal server error: ${err.message} in phlebo_login API`);
    res.status(500).json({
      error: true,
      success: false,
      message: "Internal server error.",
    });
  }
};

const get_worklist = async(req,res)=>{
   try{
    const{phlebo_id} = req.body
    if(!phlebo_id){
       return res.status(404).json({
            error: true,
            success: false,
            message: "id is required.........",
          });
    }
    const getWorklist = await prisma.labtest_order.findMany({
        where:{
          phlebo_id:phlebo_id,
          barcode_id:null
        }
    })
    console.log("getWorklist-----",getWorklist)
    // const barcodeId = getWorklist[0].barcode_id
    // console.log({barcodeId})
    // if
    
    return res.status(200).json({
        error: false,
        success: true,
        message: "Successfull.........",
        data:getWorklist
      });

   } catch (err) {
    console.error(`Internal server error: ${err.message} in get_worklist API`);
    res.status(500).json({
      error: true,
      success: false,
      message: "Internal server error.",
    });
  }
}

const phlebo_checkin = async(req,res)=>{
    try{
        const{orderId} = req.body
        const date = getCurrentDateInIST()

    if(!orderId){
       return res.status(404).json({
            error: true,
            success: false,
            message: "id is required.........",
          });
    }
    const checkin = await prisma.phlebo_checkindetails.updateMany({
        where:{
            lab_orderid:orderId,
        },
        data:{
            checkin:date
        }
    })
    console.log("checkin-----",checkin)
    return res.status(200).json({
        error: false,
        success: true,
        message: "Successfull........",
        data:checkin
      });
    }catch (err) {
    console.error(`Internal server error: ${err.message} in phlebo_checkin API`);
    res.status(500).json({
      error: true,
      success: false,
      message: "Internal server error.",
    });
  }

}

const add_barcode = async(req,res)=>{
    try{
        const{orderId,barcodeId} = req.body
       
        if(!orderId || !barcodeId){
            return res.status(404).json({
                error: true,
                success: false,
                message: "id is required.........",
              });
        }
        const updateBarcode = await prisma.labtest_order.update({
            where:{
                order_id:orderId
            },
            data:{
                barcode_id:barcodeId,
                
            }
        })
        console.log({updateBarcode})

      
        return res.status(200).json({
            error: false,
            success: true,
            message: "Successfull.........",
            data:updateBarcode
          });

    }catch (err) {
    console.error(`Internal server error: ${err.message} in phlebo_checkin API`);
    res.status(500).json({
      error: true,
      success: false,
      message: "Internal server error.",
    });
  }
}

const submit_task = async(req,res)=>{
    try{
        const{orderId} = req.body
        const date = getCurrentDateInIST()
        if(!orderId){
            return res.status(404).json({
                error: true,
                success: false,
                message: "id is required.........",
              });
        }
        
        const add_sampledate = await prisma.phlebo_checkindetails.updateMany({
            where:{
                lab_orderid:orderId
            },
            data:{
                sample_collected:date
            }
        })

        console.log({add_sampledate})
        return res.status(200).json({
            error: false,
            success: true,
            message: "Successfull.........",
            data:add_sampledate
          });

    }catch (err) {
    console.error(`Internal server error: ${err.message} in submit_task API`);
    res.status(500).json({
      error: true,
      success: false,
      message: "Internal server error.",
    });
  }
}









module.exports ={
    phlebo_login,
    get_worklist,
    phlebo_checkin,
    add_barcode,
    submit_task
}
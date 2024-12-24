const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const logDirectory = "./logs";
const winston = require("winston");
const bcrypt = require('bcrypt')
const {getCurrentDateInIST} = require('../../utils')
const { encrypt, decrypt } = require("../../utils");




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
    const secretKey = process.env.ENCRYPTION_KEY;
    
    const safeDecrypt = (text, key) => {
      try {
        return decrypt(text, key);
      } catch (err) {
        return text;
      }
    };
    
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
    const pharmAddress = []
    for(let i=0;i<findOrders.length;i++){
      const findpharmId = await prisma.sales_order.findMany({
        where:{
          sales_id:findOrders[i].sales_id
        },
        select:{
          pharmacy_id:true,
          patient_name:true
        }
      })
      console.log({findpharmId})
      const customer = findpharmId[0].customer_id
      console.log({customer})
      
      //find customer////

      const findCustomer = await prisma.user_details.findFirst({
        where:{
          id:customer
        }
      })
      console.log({findCustomer})

      const decryptedname = safeDecrypt(findCustomer.name, secretKey);
      findCustomer.name = decryptedname;
      console.log({decryptedname})

      ////find pharmacy address
      const find_phAddress = await prisma.pharmacy_details.findFirst({
        where:{
          id:findpharmId[0].pharmacy_id
        },
        select:{
          id:true,
          address:true,
          name:true
        }
      })
      console.log({find_phAddress})
      const addressData = find_phAddress.address
      const pharmName = find_phAddress.name
      pharmAddress.push({
        ...findOrders[i],
        address:addressData,
        pharmacyName:pharmName,
        patient:decryptedname
      })
    }
    if(findOrders.length === 0){
      return res.status(404).json({
        error:true,
        success:false,
        message:"no order found.........."
      })
    }
    return res.status(200).json({
      error:false,
      success:true,
      message:"Successfull......",
      data:pharmAddress
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


///////add pickedUp status/////
const pickUp_status = async(req,res)=>{
  try{
    const{orderassign_id} = req.body
    const date = getCurrentDateInIST()
    if(!orderassign_id){
      return res.status(404).json({
        error:true,
        success:false,
        message:"orderAssign id is required.........."
      })
    }
    const addStatus = await prisma.delivery_assign.update({
      where:{
          id:orderassign_id
      },
      data:{
        status:"picked up",
        picked_update:date
      }
    })
    console.log({addStatus})
    return res.status(200).json({
      error:false,
      success:true,
      message:"Successfull..........",
      data:addStatus
    })
  }catch (err) {
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

/////Accepted trips/////
const accepted_trips = async(req,res)=>{
  try{
    const {driverId} = req.body
    const secretKey = process.env.ENCRYPTION_KEY;
    
    const safeDecrypt = (text, key) => {
      try {
        return decrypt(text, key);
      } catch (err) {
        return text;
      }
    };
    const findPickUpOrders = await prisma.delivery_assign.findMany({
      where:{
        deliverypartner_id:driverId,
        status:"picked up"
      }
    })
    console.log({findPickUpOrders})
    const Address = []
    for(let i=0;i<findPickUpOrders.length;i++){
      const findpharmId = await prisma.sales_order.findMany({
        where:{
          sales_id:findPickUpOrders[i].sales_id
        },
        select:{
          pharmacy_id:true,
          customer_id:true,
          delivery_address:true,
          total_amount:true,
          delivery_location:true
        }
      })
      console.log({findpharmId})
      const customerAddress = findpharmId[0].delivery_address
      console.log({customerAddress})
      
      const deliveryLocation = findpharmId[0].delivery_location
      console.log({deliveryLocation})
      ////find pharmacy address
      const find_phAddress = await prisma.pharmacy_details.findFirst({
        where:{
          id:findpharmId[0].pharmacy_id
        },
        select:{
          id:true,
          address:true,
        }
      })
      console.log({find_phAddress})
      const cutmId = findpharmId[0].customer_id
      console.log({cutmId})
      ///find customerphone///
      const find_custPhone = await prisma.user_details.findMany({
        where:{
          id:cutmId
        },
        select:{
          phone_no:true
        }
      })
      console.log({find_custPhone})
     
      const decryptedphone = safeDecrypt(find_custPhone[0].phone_no, secretKey);
      find_custPhone[0].phone_no = decryptedphone;


      const total_amnt = findpharmId[0].total_amount
      const addressData = find_phAddress.address
      Address.push({
        ...findPickUpOrders[i],
        fromAddress:addressData,
        to_Address:customerAddress,
        customer_phone:decryptedphone,
        total_amount:total_amnt,
        deliveryLocation:deliveryLocation
      })
    }
    return res.status(200).json({
      error:false,
      success:true,
      message:"Successfull......",
      data:Address
    })
    

  }catch (err) {
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


//////verify trips////////////////
const verifyTrips = async(req,res)=>{
  try{
    const {assignOrderId} = req.body
    const secretKey = process.env.ENCRYPTION_KEY;
    
    const safeDecrypt = (text, key) => {
      try {
        return decrypt(text, key);
      } catch (err) {
        return text;
      }
    };
    const findPickUpOrders = await prisma.delivery_assign.findMany({
      where:{
        id:assignOrderId,
       
      }
    })
    console.log({findPickUpOrders})
    const Address = []
    for(let i=0;i<findPickUpOrders.length;i++){
      const findpharmId = await prisma.sales_order.findMany({
        where:{
          sales_id:findPickUpOrders[i].sales_id
        },
        select:{
          pharmacy_id:true,
          customer_id:true,
          delivery_address:true,
          delivery_location:true
        }
      })
      console.log({findpharmId})
      const customerAddress = findpharmId[0].delivery_address
      console.log({customerAddress})
      const location = findpharmId[0].delivery_location
      console.log({location})
      ////find pharmacy address
      const find_phAddress = await prisma.pharmacy_details.findFirst({
        where:{
          id:findpharmId[0].pharmacy_id
        },
        select:{
          id:true,
          name:true,
          address:true,
        }
      })
      console.log({find_phAddress})
      const cutmId = findpharmId[0].customer_id
      console.log({cutmId})
      const pharmName = find_phAddress.name
      console.log({pharmName})
      ///find customerphone///
      const find_custPhone = await prisma.user_details.findMany({
        where:{
          id:cutmId
        },
        select:{
          phone_no:true
        }
      })
      console.log({find_custPhone})
     
      const decryptedphone = safeDecrypt(find_custPhone[0].phone_no, secretKey);
      find_custPhone[0].phone_no = decryptedphone;



      const addressData = find_phAddress.address
      Address.push({
        ...findPickUpOrders[i],
        pharmcy_Name:pharmName,
        fromAddress:addressData,
        to_Address:customerAddress,
        deliveryLocation:location,
        customer_phone:decryptedphone
      })
    }
    return res.status(200).json({
      error:false,
      success:true,
      message:"Successfull......",
      data:Address
    })
    

  }catch (err) {
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

////////add deliverd status////
const addDeliveryStatus = async(req,res)=>{
  try{
    const{orderAssignId} = req.body
    const date = getCurrentDateInIST()
    if(!orderAssignId){
      return res.status(404).json({
        error:true,
        success:false,
        message:"oder Assign id is required......",
        
      })
    }
    const addDelivery = await prisma.delivery_assign.update({
      where:{
        id:orderAssignId
      },
      data:{
        status:"delivered",
        delivered_date:date
      }
    })
    console.log({addDelivery})

    const salesorder = await prisma.sales_order.update({
      where:{
        sales_id:addDelivery.sales_id
      },
      data:{
        so_status:"delivered",
        delivery_date:date
      }
    })
    console.log({salesorder})
    const deliveredDate = salesorder.delivery_date
    console.log({deliveredDate})
    const startdate = new Date(deliveredDate).toISOString().split('T')[0].replace(/-/g, '/');
    // const startdate = deliveredDate.split('T')[0].replace(/-/g, '/');
    console.log({startdate})

    const addStartDate = await prisma.medicine_timetable.updateMany({
      where:{
        sales_id:addDelivery.sales_id
      },
      data:{
        startDate:startdate
      }
    })
    console.log({addStartDate})
    return res.status(200).json({
      error:false,
      success:true,
      message:"Successfull......",
      data:addDelivery
    })

  }catch (err) {
        logger.error(
          `Internal server error: ${err.message} in addDeliveryStatus api`,
          console.log({err})
        );
        res.status(400).json({
          error: true,
          message: "internal server error",
        });
      }
}

///////get fulfilled order///
const get_fulfilledOrders = async(req,res)=>{
  try{
    const{driverId} = req.body
    const date = getCurrentDateInIST()
    if(!driverId){
      return res.status(404).json({
        error:true,
        success:false,
        message:"oder Assign id is required......",
        
      })
    }
    const getFulfilledOrders = await prisma.delivery_assign.findMany({
      where:{
        deliverypartner_id:driverId,
        status:"delivered",
      },
     
    })
    console.log({getFulfilledOrders})
    const toAddress = []
    for(let i=0;i<getFulfilledOrders.length; i++){
      const get_toAddress = await prisma.sales_order.findMany({
        where:{
          sales_id:getFulfilledOrders[i].sales_id
        },
        select:{
          delivery_address:true
        }
      })
      console.log({get_toAddress})
      toAddress.push({
        ...getFulfilledOrders[i],
        to_Address:get_toAddress[0].delivery_address
      })
    }
    return res.status(200).json({
      error:false,
      success:true,
      message:"Successfull......",
      data:toAddress
    })

  }catch (err) {
        logger.error(
          `Internal server error: ${err.message} in get_fulfilledOrders api`,
          console.log({err})
        );
        res.status(400).json({
          error: true,
          message: "internal server error",
        });
      }
}

/////wallet/////
const wallet = async(req,res)=>{
  try{
    const{driverId} = req.body
    if(!driverId){
      return res.status(404).json({
        error:true,
        success:false,
        message:"driverId is required.........."
      })
    }
    const orderDetails = await prisma.delivery_assign.findMany({
      where:{
        deliverypartner_id:driverId,
        status:"delivered"
      },
      select:{
        id:true,
        sales_id:true,
        
      }
    })
    console.log({orderDetails})
    const wallet = []
    for(let i=0; i<orderDetails.length;i++){
      const findPharmacy = await prisma.sales_order.findFirst({
        where:{
          sales_id:orderDetails[i].sales_id
        },
        select:{
          total_amount:true,
          pharmacy_id:true
        }
      })
      console.log({findPharmacy})
      const amount = findPharmacy.total_amount
      console.log({amount})

      const findPharmacyName = await prisma.pharmacy_details.findMany({
        where:{
          id:findPharmacy.pharmacy_id
        },
        select:{
          id:true,
          name:true,

        }
      })
      console.log({findPharmacyName})
      const pharmacyName = findPharmacyName[0].name
      console.log({pharmacyName})
      wallet.push({
        ...orderDetails[i],
       pharmacy:pharmacyName,
       amount:amount
      })
    }
    return res.status(200).json({
      error:false,
      success:true,
      message:"Successfull.........",
      data:wallet
    })
  }catch (err) {
        logger.error(
          `Internal server error: ${err.message} in get_fulfilledOrders api`,
          console.log({err})
        );
        res.status(400).json({
          error: true,
          message: "internal server error",
        });
      }
}

// const wallet = async (req, res) => {
//   try {
//     const { driverId } = req.body;
//     if (!driverId) {
//       return res.status(404).json({
//         error: true,
//         success: false,
//         message: "driverId is required..........",
//       });
//     }

//     const orderDetails = await prisma.delivery_assign.findMany({
//       where: {
//         deliverypartner_id: driverId,
//         status: "delivered",
//       },
//       select: {
//         id: true,
//         sales_id: true,
//       },
//     });

//     console.log({ orderDetails });

//     const pharmacyData = {};

//     for (let i = 0; i < orderDetails.length; i++) {
//       const findPharmacy = await prisma.sales_order.findFirst({
//         where: {
//           sales_id: orderDetails[i].sales_id,
//         },
//         select: {
//           total_amount: true,
//           pharmacy_id: true,
//         },
//       });

//       console.log({ findPharmacy });

//       const amount = Number(findPharmacy.total_amount);

//       const findPharmacyName = await prisma.pharmacy_details.findFirst({
//         where: {
//           id: findPharmacy.pharmacy_id,
//         },
//         select: {
//           id: true,
//           name: true,
//         },
//       });

//       console.log({ findPharmacyName });

//       const pharmacyId = findPharmacyName.id;
//       const pharmacyName = findPharmacyName.name;

//       // Aggregate total amount for each pharmacy
//       if (!pharmacyData[pharmacyId]) {
//         pharmacyData[pharmacyId] = {
//           pharmacy: pharmacyName,
//           totalAmount: 0,
//           orders: [],
//         };
//       }

//       pharmacyData[pharmacyId].totalAmount += amount;
//       pharmacyData[pharmacyId].orders.push(orderDetails[i]);
//     }

//     // Format the response
//     const wallet = Object.values(pharmacyData).map((pharmacy) => ({
//       pharmacy: pharmacy.pharmacy,
//       totalAmount: pharmacy.totalAmount,
//       // orders: pharmacy.orders,
//     }));

//     return res.status(200).json({
//       error: false,
//       success: true,
//       message: "Successful.........",
//       data: wallet,
//     });
//   } catch (err) {
//     console.error(
//       `Internal server error: ${err.message} in wallet API`,
//       { err }
//     );
//     res.status(500).json({
//       error: true,
//       message: "Internal server error",
//     });
//   }
// };


////get prescription
const get_prescription = async(req,res)=>{
  try{
    const{salesId} = req.body
    if(!salesId){
      return res.status(404).json({
        error:true,
        success:false,
        message:"salesId is required........"
      })
    }
    const prescription = await prisma.sales_order.findMany({
      where:{
        sales_id:salesId
      },
      select:{
        sales_id:true,
        prescription_image:true
      }
    })
    console.log({prescription})
    if(prescription[0].prescription_image === null){
      return res.status(200).json({
        error:true,
        success:false,
        message:"prescription not found..........",
     
      })
    }
    return res.status(200).json({
      error:false,
      success:true,
      message:"Successfull..........",
      data:prescription
    })

  }catch (err) {
        logger.error(
          `Internal server error: ${err.message} in get_prescription api`,
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
    getorder,
    pickUp_status,
    accepted_trips,
    verifyTrips,
    addDeliveryStatus,
    get_fulfilledOrders,
    wallet,
    get_prescription
  }
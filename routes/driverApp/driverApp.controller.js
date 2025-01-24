const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const logDirectory = "./logs";
const winston = require("winston");
const bcrypt = require('bcrypt')
const {getCurrentDateInIST} = require('../../utils')
const { encrypt, decrypt } = require("../../utils");
const nodemailer = require('nodemailer')



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
          patient_name:true,
          customer_id:true
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
      // console.log({findCustomer})

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

    const checkWallet = await prisma.delivery_partner.findMany({
      where:{
        id:driverId
      },
      select:{
        wallet:true
      }
    })
    console.log({checkWallet})

    const hasBalance = checkWallet.some((wallet) => wallet.wallet > 0);
    console.log({hasBalance})


    const walletBalance =[]

    if(hasBalance){
    const walletMess = "Balance in wallet........."
    walletBalance.push(walletMess)
    }

    return res.status(200).json({
      error:false,
      success:true,
      message:"Successfull......",
      data:pharmAddress,
      message:walletBalance
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
const wallet = async (req, res) => {
  try {
    const { driverId } = req.body;
    if (!driverId) {
      return res.status(404).json({
        error: true,
        success: false,
        message: "driverId is required..........",
      });
    }

    const orderDetails = await prisma.delivery_assign.findMany({
      where: {
        deliverypartner_id: driverId,
        status: "delivered",
        payment_method: "cod",
        OR: [
          { credited_payment: { not: "yes" } },
          { credited_payment: null },
        ],
      },
      select: {
        id: true,
        sales_id: true,
       
      },
    });
    console.log({ orderDetails });

    // To store aggregated data
    const walletMap = new Map();

    for (let i = 0; i < orderDetails.length; i++) {
      const findPharmacy = await prisma.sales_order.findFirst({
        where: {
          sales_id: orderDetails[i].sales_id,
        },
        select: {
          total_amount: true,
          pharmacy_id: true,
          patient_name:true
       
        },
      });

      console.log({ findPharmacy });
      const amount = findPharmacy.total_amount;
      console.log({amount})
      const userName = findPharmacy.patient_name
      console.log({userName})

      const findPharmacyName = await prisma.pharmacy_details.findFirst({
        where: {
          id: findPharmacy.pharmacy_id,
        },
        select: {
          id: true,
          name: true,
        },
      });

      console.log({ findPharmacyName });
      const pharmacyName = findPharmacyName.name;
      const amounts = parseFloat(findPharmacy.total_amount); // Ensure it's a number
      if (!walletMap.has(findPharmacyName.id)) {
        walletMap.set(findPharmacyName.id, {
          // userName:userName,
          pharmacy: pharmacyName,
          amount:0,
          orders: [],
        });
      }

     
  const walletEntry = walletMap.get(findPharmacy.pharmacy_id);
  walletEntry.amount += amounts; // Perform arithmetic
  walletEntry.orders.push({...orderDetails[i],
    userName: userName,        // Add userName
    totalAmount: amounts, 

    });
    }

    // Convert Map to an array for the response
    const wallet = Array.from(walletMap.values()).map((entry) => ({
      pharmacy: entry.pharmacy,
      totalAmount: entry.amount,
      orders: entry.orders,
      
    }));

    const walletTotal =[]
    for(let j=0; j<wallet.length; j++){
        const walletAmount = wallet[j].totalAmount
        console.log({walletAmount})
        let totalWalletAmount = wallet.reduce((sum, item) => sum + item.totalAmount, 0);
        console.log({ totalWalletAmount });
        walletTotal.push({totalWalletAmount})
         //// update delivery partner table////////
    const updateDeliveryPartner = await prisma.delivery_partner.update({
      where:{
        id:driverId,
       
      },
      data:{
        wallet:totalWalletAmount
      }
    })
    console.log({updateDeliveryPartner})
    }
    console.log({walletTotal})
   

    return res.status(200).json({
      error: false,
      success: true,
      message: "Successful.........",
      data: wallet,
      walletTotal:walletTotal
    });
  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in wallet API`,
      console.log({ err })
    );
    res.status(400).json({
      error: true,
      message: "Internal server error",
    });
  }
};


//////////add payment method//////////
const addPayment_method = async(req,res)=>{
  try{
    const{sales_id,payment_method,driverId} = req.body
    if(!sales_id || !payment_method){
      return res.status(404).json({
        error:true,
        success:false,
        message:"missing fields........"
       
      })
    }

    const paymentData = await prisma.delivery_assign.updateMany({
      where:{
        sales_id:sales_id,
        deliverypartner_id:driverId
      },
      data:{
        payment_method
      }
    })
    console.log({paymentData})
    res.status(200).json({
      error:false,
      success:true,
      message:"Successfull........",
      data:paymentData
    })
  }catch (err) {
        logger.error(
          `Internal server error: ${err.message} in addPayment_method api`,
          console.log({err})
        );
        res.status(400).json({
          error: true,
          message: "internal server error",
        });
      }
}

//////////for adding payment status//////////
const payment_creditedStatus = async(req,res)=>{
  try{
    const{sales_id,credited_Payment,driverId} = req.body
    if(!sales_id || !credited_Payment){
      return res.status(404).json({
        error:true,
        success:false,
        message:"missing fields........"
       
      })
    }

    const creditedpaymentStatus = await prisma.delivery_assign.updateMany({
      where:{
        sales_id:sales_id,
        deliverypartner_id:driverId
      },
      data:{
      credited_payment:credited_Payment
      }
    })
    console.log({creditedpaymentStatus})
    res.status(200).json({
      error:false,
      success:true,
      message:"Successfull........",
      data:creditedpaymentStatus
    })
  }catch (err) {
        logger.error(
          `Internal server error: ${err.message} in payment_creditedStatus api`,
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


///add prescription status
const prescriptionStatus = async(req,res)=>{
  const { salesId,status,driverId} = req.body
  try{
    if(!salesId || !status ||  !driverId){
      return res.status(404).json({
        error:true,
        success:false,
        message:"something  is missing........"
      })
    }
    const addStatus = await prisma.delivery_assign.updateMany({
      where:{
        sales_id:salesId,
        deliverypartner_id:driverId
      },
      data:{
        prescription_analysis:status
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
      `Internal server error: ${err.message} in prescriptionStatus api`,
      console.log({err})
    );
    res.status(400).json({
      error: true,
      message: "internal server error",
    });
  }

}

//add stamp status
const add_stampStatus = async(req,res)=>{
  const { salesId,status,driverId} = req.body
  try{
    if(!salesId || !status ||  !driverId){
      return res.status(404).json({
        error:true,
        success:false,
        message:"something  is missing........"
      })
    }
    const stampStatus = await prisma.delivery_assign.updateMany({
      where:{
        sales_id:salesId,
        deliverypartner_id:driverId
      },
      data:{
        stamp_statusUpdate:status
      }
    })
    console.log({stampStatus})

    return res.status(200).json({
      error:false,
      success:true,
      message:"Successfull..........",
      data:stampStatus
    })
  }catch (err) {
    logger.error(
      `Internal server error: ${err.message} in add_stampStatus api`,
      console.log({err})
    );
    res.status(400).json({
      error: true,
      message: "internal server error",
    });
  }

}


////change password/////
const changePassword = async(req,res)=>{
  try{
    const {driverId,password} = req.body
    if(driverId && password){
      const findUser = await prisma.delivery_partner.findFirst({
        where:{
          id:driverId
        }
      })
      console.log({findUser})
      if(findUser){
        const hashedpassword = await bcrypt.hash(password, 10);
        const change_password = await prisma.delivery_partner.updateMany({
          where:{
            id:driverId
          },
          data:{
            password:hashedpassword
          }
        })
        console.log({change_password})
      
      return res.status(200).json({
        error:false,
        succes:true,
        message:"Successfully changed the password............",
        data:change_password
      })
    }else{
      return res.status(404).json({
        error:true,
        succes:false,
        message:"user not found............",
      })
    }
     }else{
      return res.status(200).json({
        error:false,
        succes:true,
        message:"driver id and password are required..............",
      
      })
     }

  }catch (error) {
    logger.error(
      `Internal server error: ${error.message} in driver-changePassword API`
    );
    console.error(error);
    return response.status(500).json({ error: "Internal Server Error" });
  } finally {
    //await prisma.$disconnect();
  }
}

////fprgot password////
const forgot_password = async (req, res) => {
  const { email } = req.body
  try {

    const check_user = await prisma.delivery_partner.findFirst({
      where: {
        email: email
      }

    })
    // console.log("check_user----",check_user)
    if (check_user) {
      // console.log("first")
      // const randomPassword = crypto.randomBytes(8).toString('hex');
      function generateOTP() {
        // Generate a random 6-digit number
        const otp = Math.floor(10000 + Math.random() * 900000);
        return otp.toString();
      }

      const randomOTP = generateOTP();
      console.log(randomOTP);
      const add_temOtp = await prisma.delivery_partner.updateMany({
        where:{
          email:email
        },
        data:{
          otp:randomOTP
        }
      })
      console.log({add_temOtp})
      // const hashedPassword = await bcrypt.hash(randomOTP, 10)

      // await prisma.pharmacy_details.updateMany({
      //   where: {
      //     email: email
      //   },
      //   data: {
      //     password: hashedPassword
      //   }
      // })
      const transpoter = nodemailer.createTransport({
        host: "smtp.zoho.in",
        port: 465,
        auth: {
          user: "support@chaavie.com",
          pass: "GWExAA8yGEnC",
        },
      });
      const mailTemplate = `
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>2FA OTP Email Template</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin: 0; padding: 0;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="90%"
            style="border-collapse: collapse; border: 30px solid #e7e7e7;">
          <tbody style="padding:0px 30px; display: block;">
            <tr>
              <td style="padding: 56px 0 24px 26px;">
                <img src="..." alt="Logo">
              </td>
            </tr>
            <tr>
              <td height="42"
                  style="padding: 10px 0 4px 24px; color: #000000; font-family: Arial, sans-serif; font-weight: 800; font-size: 26px;">
                <b>Hi ${check_user.name || "User"}</b>
              </td>
            </tr>
            <tr>
              <td style="padding:1px 24px 22px; color:#606060; font-size:14px; font-family: Arial, sans-serif; line-height: 1.5;">
                You have successfully registered your account in DoctorOne<br />
                A One-Time Password (OTP) has been generated. This OTP is time-sensitive and valid for single-user access.<br>
               
              </td>
            </tr>
            <tr>
              <td style="padding:1px 24px 22px; color:#606060; font-size:14px; font-weight: 800; font-family: Arial, sans-serif; line-height: 1.5;">
                Your One-Time Password (OTP) is:
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 24px; text-align: center; font-size: 20px; font-weight: bold; color: #000;">
                ${randomOTP}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 24px 50px; color:#606060; font-size:14px; font-family: Arial, sans-serif; line-height: 20px; text-align: left;">
                Need help? Contact Customer Support.<br>
                Toll-Free No. 9544688490 or<br>
                Email us at <a href="mailto:mmusthafa270@gmail.com" style="color:#0889c4; text-decoration:none;">mmusthafa270@gmail.com</a>
              </td>
            </tr>
          </tbody>
          <tr>
            <td style="padding:28px 0 0; color: #606060; font-family: Arial, sans-serif; font-size: 12px; background-color: #e7e7e7;">
              &copy; Rent My Thing. All Rights Reserved<br><br>
              The content of this message, together with any attachments, are intended only for the use of the
              person(s) to which they are addressed and may contain confidential and/or privileged information.
            </td>
          </tr>
        </table>
      </body>
      </html>`;
      const mailOptions = {
        from: "support@chaavie.com",
        to: email,
        subject: 'new password',
        html:mailTemplate
        // template: "pharmacy_otp", // Name of the Handlebars template
        // text: `Dear user ,\nYour new password:\nPassword: ${randomOTP}\n\nThank you.`,
      }
      transpoter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("error sending in mail:-----", error);
          res.status(400).json({
            error: true,
            success: false,
            meassage: "Error happend in sending the mail"
          })

        } else {
          res.status(200).json({
            error: false,
            success: true,
            message: "new password send successfully",
           
          })
        }
      })
    } else {
      console.log("user not found")
      res.status(404).json({
        error: true,
        success: false,
        message: "user with entered mail not found......."
      })
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in driver-forgot_password API`
    );
    console.error(error);
    return response.status(500).json({ error: "Internal Server Error" });
  } finally {
    //await prisma.$disconnect();
  }
}



const confirmDelivery_otp = async(req,res)=>{
  try{
    const{orderId,otp} = req.body
    if(!orderId || !otp){
      return res.status(404).json({
        error:true,
        success:false,
        message:"missing field"
      })
    }
    const confirmOtp = await prisma.sales_order.findMany({
      where:{
        sales_id:orderId,
        otp:otp
      }
    })
    console.log({confirmOtp})
    if(!confirmOtp){
      return res.status(404).json({
        error:true,
        success:false,
        message:"Recheck otp"
      })
    }
    return res.status(200).json({
      error:false,
      success:true,
      message:"Successfulll............",
      data:confirmOtp
    })

  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in driver-confirmDelivery_otp API`
    );
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    //await prisma.$disconnect();
  }
}



/////verify otp///////
const verifyOtp = async(req,res)=>{
  try{
    const {driverEmail,otp} = req.body
    if(driverEmail && otp){
      const findId = await prisma.delivery_partner.findMany({
        where:{
           email:driverEmail
        }
      })
      console.log({findId})
      const driverId = findId[0].id
      console.log({driverId})
    const verify = await prisma.delivery_partner.findUnique({
      where:{
        id:driverId,
        otp:otp
      }
    })
    console.log({verify})
    if(!verify){
      return res.status(404).json({
        error:true,
        success:false,
        message:"check otp......",
       
      })
    }
    return res.status(200).json({
      error:false,
      success:true,
      message:"Successfull..........",
      data:verify
    })
  }else{
    return res.status(404).json({
      error:true,
      success:false,
      message:"pharmacy id and otp are required..........."
    })
  }

  }catch (error) {
    logger.error(
      `Internal server error: ${error.message} in chemist-verifyOtp API`
    );
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    //await prisma.$disconnect();
  }
}


const settleFull_amt = async(req,res)=>{
  try{
    const{sales_id,credited_Payment,driverId} = req.body
    if(!sales_id || !credited_Payment){
      return res.status(404).json({
        error:true,
        success:false,
        message:"missing fields........"
       })
    }

    if(!Array.isArray(sales_id)){
      return res.status(404).json({
        error:true,
        success:false,
        message:"salesId should be an arrayy..........."
       })
    }

    const creditedpaymentStatus = await prisma.delivery_assign.updateMany({
      where:{
        // sales_id:sales_id,
        sales_id:{
          in:sales_id
        },
        deliverypartner_id:driverId
      },
      data:{
      credited_payment:credited_Payment
      }
    })
    console.log({creditedpaymentStatus})
    res.status(200).json({
      error:false,
      success:true,
      message:"Successfull........",
      data:creditedpaymentStatus
    })
  }catch (error) {
    logger.error(
      `Internal server error: ${error.message} in driver-settleFull_amt API`
    );
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    //await prisma.$disconnect();
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
    get_prescription,
    prescriptionStatus,
    add_stampStatus,
    changePassword,
    forgot_password,
    addPayment_method,
    payment_creditedStatus,
    confirmDelivery_otp,
    verifyOtp,
    settleFull_amt
  }
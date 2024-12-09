const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const logDirectory = "./logs";
const winston = require("winston");
// const crypto = require('crypto');
const admin = require('../../firebase')
const bcrypt = require("bcrypt");
const { messaging } = require("firebase-admin");
const nodemailer = require('nodemailer')
const {getCurrentDateInIST} = require('../../utils')




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
      return res.status(404).json({
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
const getOrder = async (req, res) => {
  try {
    const { chemistId } = req.body;

    if (!chemistId) {
      return res.status(200).json({
        error: true,
        success: false,
        message: "Chemist ID is required.",
      });
    }

    const getCompleteOrder = await prisma.pharmacyquotation.findMany({
      where: {
        pharmacy_id: chemistId,
        status: "requested",
        
      },
      orderBy:{
        id:"asc"
      }
    });

    if (getCompleteOrder.length === 0) {
      return res.status(404).json({
        error: true,
        success: false,
        message: "No order found.",
      });
    }

    const order = [];
    
    for (let i = 0; i < getCompleteOrder.length; i++) {
      const salesId = getCompleteOrder[i].sales_id;

      const getSaleslist = await prisma.sales_list.findMany({
        where: {
          sales_id: salesId,
        },
      });

      const productlist = [];
      for (let j = 0; j < getSaleslist.length; j++) {
        const productId = getSaleslist[j].product_id;

        // Fetch product details
        const getProduct = await prisma.generic_product.findUnique({
          where: {
            id: productId,
          },
        });

        // Add productName directly to the sales list item
        productlist.push({
          ...getSaleslist[j],
          productName: getProduct ? getProduct.name : null,
        });
      }
    ///get price of the order
      const getPrice = await prisma.sales_order.findFirst({
      where:{
        sales_id:salesId
      },
      select:{
        total_amount:true
      }
     })
     console.log({getPrice})
     const price = getPrice.total_amount
     console.log({price})
      order.push({
        ...getCompleteOrder[i],
        product_amt:price,
        productlist, // Include the modified product list with product names
      });
    }

    res.status(200).json({
      error: false,
      success: true,
      message: "Successful",
      data: order,
    });
  } catch (err) {
    console.error(`Internal server error: ${err.message} in getOrder API`);
    res.status(500).json({
      error: true,
      success: false,
      message: "Internal server error.",
    });
  }
};


///////order accept/reject /////
const orderResponse = async(req,res)=>{
  try{
    const {quotationId,status} = req.body
   if(quotationId && status){
    const addResponse = await prisma.pharmacyquotation.update({
      where:{
        id:quotationId
      },
      data:{
        status:status
      }
    })
    console.log({addResponse})
    
    const addPackedStatus = await prisma.sales_order.updateMany({
      where:{
        sales_id:addResponse.sales_id
      },
      data:{
        so_status:"packed"
      }
    })

    console.log({addPackedStatus})
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

const getConfirmedOrder = async (req, res) => {
  try {
    const { chemistId } = req.body;

    if (!chemistId) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Chemist ID is required.",
      });
    }

    const getorder = await prisma.pharmacyquotation.findMany({
      where: {
        pharmacy_id: chemistId,
        status: {
          in: ["packed", "Accepted", "ready to ship"],
        },
      },
    });
   
    if (getorder.length === 0) {
      return res.status(404).json({
        error: true,
        success: false,
        message: "No confirmed orders found.",
      });
    }

    const orders = [];

    for (let i = 0; i < getorder.length; i++) {
      const salesId = getorder[i].sales_id;

      const getSaleslist = await prisma.sales_list.findMany({
        where: {
          sales_id: salesId,
        },
      });

      const productlist = [];
      for (let j = 0; j < getSaleslist.length; j++) {
        const productId = getSaleslist[j].product_id;

        // Fetch product details
        const getProduct = await prisma.generic_product.findUnique({
          where: {
            id: productId,
          },
        });

        // Add productName directly to the sales list item
        productlist.push({
          ...getSaleslist[j],
          productName: getProduct ? getProduct.name : null,
        });
      }
      
      ////get net amount
      const getAmt = await prisma.sales_order.findFirst({
        where:{
          sales_id:salesId
        },
        select:{
          total_amount:true
        }
      })
      console.log({getAmt})
      const price = getAmt.total_amount
      console.log({price})
      orders.push({
        ...getorder[i],
        price:price,
        productlist, // Include the enhanced product list
      });
    }

    res.status(200).json({
      error: false,
      success: true,
      message: "Successful",
      data: orders,
    });
  } catch (err) {
    console.error(`Internal server error: ${err.message} in getConfirmedOrder API`);
    res.status(500).json({
      error: true,
      success: false,
      message: "Internal server error.",
    });
  }
};




const getproductspharmacy = async (request, response) => {
  console.log({request})
  try {
    const { pharmacy_id } = request.body;

    if (!pharmacy_id) {
      return response.status(400).json({
        error: true,
        message: "pharmacy_id can't be null or empty.",
      });
    }

    const pharmacyMedicines = await prisma.pharmacy_medicines.findFirst({
      where: {
        pharmacy_id: pharmacy_id,
      },
      select: {
        pharmacy_id: true,
        product_ids: true,
        created_date: true,
      },
    });
    console.log({pharmacyMedicines})
    


    if (!pharmacyMedicines) {
      return response.status(404).json({
        success: false,
        error: true,
        message: "No medicines found for the provided pharmacy_id.",
      });
    }

    const productIds = pharmacyMedicines.product_ids;
    const products = [];

    // Fetch details for each product ID
    for (const productId of productIds) {
      const product = await prisma.generic_product.findFirst({
        where: {
          id: productId,
        },
        select:{
          name:true,
          // categ ory:true
        }
      });

      console.log({product})
      if (product) {
        products.push(product);
      }
    }

    return response.status(200).json({
      success: true,
      error: false,
      message: "Products retrieved successfully.",
      data: {
        pharmacy_id: pharmacyMedicines.pharmacy_id,
        products,
      },
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in chemist-getproducts API`
    );
    console.error(error);
    return response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};


//getting notification while assinging the order
const assignpharmacy = async (request, response) => {
  try {
    const { sales_id, pharmacy_id, status,fcmToken } = request.body;
    const datetime = getCurrentDateInIST();

    // Validate the required fields
    if (!sales_id || !pharmacy_id) {
      return response.status(400).json({
        error: true,
        message: "sales_id and pharmacy_id can't be null or empty.",
      });
    }

    const add = await prisma.pharmacyquotation.create({
      data: {
        status: status,
        sales_id: sales_id,
        pharmacy_id: pharmacy_id,
        created_date: datetime,
        Stmodified_date: datetime,
        
      },
    });
    const update = await prisma.sales_order.update({
      where: {
        sales_id: sales_id,
      },
      data: {
        pharmacy_id: pharmacy_id,
      },
    });
    
    if(update){
      // const messageNotification = 
      const addNotification = await prisma.pharmacy_notification.create({
    
       data:{
        pharmacyId:pharmacy_id,
        message:"New order has been assigned",
        created_date:datetime,
        view_status:"Not seen"
       }
      })
      console.log({addNotification})

      const message = {
        notification:{
          title:"Pharmacy Assigned",
          body:"New order assigned.....❗"
        },
        token:fcmToken
      }
    
    try{
      await admin.messaging().send(message)
      console.log("Notification send Successfully")
    }catch(err){
      console.error({err})
    }
  }
    if (add) {
      return response.status(200).json({
        success: true,
        error: false,
        message: "Pharmacy assigned successfully.",
      });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in chemist-assignpharmacy API`);
    console.log({error})
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};


//add token for pharmacy
const addTokenPh = async(req,res)=>{
  try{
    const {id,token} = req.body
    if(id && token){
    const addToken = await prisma.pharmacy_details.update({
      where:{
        id:id
      },
      data:{
        token:token
      }
    })
    console.log({addToken})
    return res.status(200).json({
      error:false,
      success:true,
      message:"Successfull..........",
      data:addToken
    })
  }else{
    return res.status(404).json({
      error:true,
      success:false,
      message:"id and token are required........."
    })
  }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in chemist-addTokenPh API`);
    
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}

////change password////
const changePassword = async(req,res)=>{
  try{
    const {pharmacy_id,password} = req.body
    if(pharmacy_id && password){
      const findUser = await prisma.pharmacy_details.findFirst({
        where:{
          id:pharmacy_id
        }
      })
      console.log({findUser})
      if(findUser){
        const hashedpassword = await bcrypt.hash(password, 10);
        const change_password = await prisma.pharmacy_details.update({
          where:{
            id:pharmacy_id
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
        message:"pharmacy id and password are required..............",
      
      })
     }

  }catch (error) {
    logger.error(
      `Internal server error: ${error.message} in chemist-changePassword API`
    );
    console.error(error);
    return response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}

////forgot password//////
const forgot_password = async (req, res) => {
  const { email } = req.body
  try {

    const check_user = await prisma.pharmacy_details.findFirst({
      where: {
        email: email
      }

    })
    // console.log("check_user----",check_user)
    if (check_user) {
      // console.log("first")
      // const randomPassword = crypto.randomBytes(8).toString('hex');
      function generateOTP() {
        // Generate a random 5-digit number
        const otp = Math.floor(10000 + Math.random() * 90000);
        return otp.toString();
      }

      const randomOTP = generateOTP();
      console.log(randomOTP);
      const hashedPassword = await bcrypt.hash(randomOTP, 10)
      await prisma.pharmacy_details.updateMany({
        where: {
          email: email
        },
        data: {
          password: hashedPassword
        }
      })
      const transpoter = nodemailer.createTransport({
        host: "smtp.zoho.in",
        port: 465,
        auth: {
          user: "support@chaavie.com",
          pass: "GWExAA8yGEnC",
        },
      });
      const mailOptions = {
        from: "support@chaavie.com",
        to: email,
        subject: 'new password',
        text: `Dear user ,\nYour new password:\nPassword: ${randomOTP}\n\nThank you.`,
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
            data: check_user
          })
        }
      })
    } else {
      console.log("user not found")
      res.status(404).json({
        error: true,
        success: false,
        message: "user with entered mail not found"
      })
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in chemist-forgot_password API`
    );
    console.error(error);
    return response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}


//get notification
const get_notification = async(req,res)=>{
  try{
    const{pharmacyId} = req.body
    if(!pharmacyId){
      return res.status(404).json({
        error:true,
        success:false,
        message:"PharmacyId is required..............."
      })
    }
    const getNotification = await prisma.pharmacy_notification.findMany({
      where:{
        pharmacyId:pharmacyId
      }
    })
    console.log({getNotification})
  }catch (error) {
    logger.error(
      `Internal server error: ${error.message} in chemist-get_notification API`
    );
    console.error(error);
    return response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}

//add seen status
const addSeenStatus = async(req,res)=>{
  try{
    const {pharmacyId,notificationId} = req.body
    if(pharmacyId && notificationId){
    const addStatus = await prisma.pharmacy_notification.update({
      where:{
        pharmacyId:pharmacyId,
        id:notificationId
      },
      data:{
        view_status:"Seen"
      }
    })
   return res.status(200).json({
      error:false,
      success:true,
      message:"Successfull.....",
      data:addStatus
    })
  }else{
    return res.status(400).json({
      error:true,
      success:false,
      message:"pharmacyid and notificationId are required.....",
      data:addStatus
    })
  }
  }catch (error) {
    logger.error(
      `Internal server error: ${error.message} in chemist-addSeenStatus API`
    );
    console.error(error);
    return response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = {
    chemist_login,
    addChemist,
    chemist_profile,
    getOrder,
    orderResponse,
    getConfirmedOrder,
    getproductspharmacy,
    assignpharmacy,
    addTokenPh,
    changePassword,
    forgot_password,
    get_notification,
    addSeenStatus
}
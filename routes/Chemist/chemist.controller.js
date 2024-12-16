const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const logDirectory = "./logs";
const winston = require("winston");
// const crypto = require('crypto');
// const admin = require('../../firebase')
const secondApp = require('../../firebase')
const bcrypt = require("bcrypt");
const { messaging } = require("firebase-admin");
const nodemailer = require('nodemailer')
const {getCurrentDateInIST,decrypt} = require('../../utils');
const { getLogger } = require("nodemailer/lib/shared");
// const pharmacy_otp = require('../../views')





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
    const secretKey = process.env.ENCRYPTION_KEY;
    
    const safeDecrypt = (text, key) => {
      try {
        return decrypt(text, key);
      } catch (err) {
        return text;
      }
    };
    
    if (!chemistId) {
      return res.status(200).json({
        error: true,
        success: false,
        message: "Chemist ID is required.",
      });
    }

    const getCompleteOrder = await prisma.pharmacy_assign.findMany({
      where: {
        pharmacy_id: chemistId,
        status: "requested",
        
      },
      orderBy:{
        id:"asc"
      }
    });
    console.log({getCompleteOrder})
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
     ////get customerName////
    //  const getCustomerName = await prisma.sales_order.findMany({
    //   where:{
    //     sales_id: salesId,
    //   }
    //  })
    //  console.log({getCustomerName})
    //  const getName = getCustomerName[0].patient_name
    //  console.log({getName})
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
      const getPrice = await prisma.sales_order.findMany({
      where:{
        sales_id:salesId
      },
      select:{
        total_amount:true,
        patient_name:true,
        doctor_name:true,
        customer_id:true
      }
     })
     console.log({getPrice})
     const price = getPrice[0].total_amount
     console.log({price})
    //  const userName = getPrice[0].patient_name
     const doctor = getPrice[0].doctor_name
     const customerName = getPrice[0].customer_id
     console.log({customerName})
     const getCustomerName = await prisma.user_details.findMany({
      where:{
        id:customerName
      }
     })
     console.log({getCustomerName})
     const decryptedname = safeDecrypt(getCustomerName[0].name, secretKey);
     getCustomerName[0].name = decryptedname;
      console.log({decryptedname})

      order.push({
        ...getCompleteOrder[i],
        product_amt:price,
        user : decryptedname,
        doctorName:doctor,
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
    const date = getCurrentDateInIST()
   if(quotationId && status){
    const addResponse = await prisma.pharmacy_assign.update({
      where:{
        id:quotationId
      },
      data:{
        status:status,
        Stmodified_date:date
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
    const secretKey = process.env.ENCRYPTION_KEY;
    
    const safeDecrypt = (text, key) => {
      try {
        return decrypt(text, key);
      } catch (err) {
        return text;
      }
    };
    const { chemistId } = req.body;

    if (!chemistId) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Chemist ID is required.",
      });
    }

    const getorder = await prisma.pharmacy_assign.findMany({
      where: {
        pharmacy_id: chemistId,
        status: {
          in: ["packed", "Accepted", "ready to ship"],
        },
      },
    });
   const getPharm_name = await prisma.pharmacy_details.findFirst({
    where:{
      id:chemistId
    },
    select:{
      name:true
    }
   })
   console.log({getPharm_name})
   const pharmacy = getPharm_name.name
   console.log({pharmacy})
   
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
          total_amount:true,
          customer_id:true,
          doctor_name:true
        }
      })
      console.log({getAmt})
      const price = getAmt.total_amount
      console.log({price})
      const doctor = getAmt.doctor_name
      console.log({doctor})
      const findCustomer = await prisma.user_details.findMany({
        where:{
          id:getAmt.customer_id
        }
      })
      console.log({findCustomer})
      const decryptedname = safeDecrypt(findCustomer[0].name, secretKey);
      findCustomer[0].name = decryptedname;

      orders.push({
        ...getorder[i],
        price:price,
        productlist, // Include the enhanced product list,
        pharmacyName:pharmacy,
        doctor_name:doctor,
        userName:decryptedname
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
const  assignpharmacy = async (request, response) => {
  try {
    const { sales_id, pharmacy_id, status } = request.body;
    const datetime = getCurrentDateInIST();
    // console.log({first})

    // Validate the required fields
    if (!sales_id || !pharmacy_id) {
      return response.status(400).json({
        error: true,
        message: "sales_id and pharmacy_id can't be null or empty.",
      });
    }
    const find = await prisma.pharmacy_assign.findFirst({
      where: {
        sales_id: sales_id,
        pharmacy_id: pharmacy_id,
      },
    });
    if (find) {
      return response.status(400).json({
        error: true,
        message: "pharmacy already assigned",
      });
    }
    //////find pharmacy details/////
    const findPharmacy = await prisma.pharmacy_details.findUnique({
      where:{
        id:pharmacy_id
      },
      select:{
        token:true
      }
    })
    console.log({findPharmacy})
    const fcmToken = findPharmacy.token
    console.log({fcmToken})

    /////for assigning pharmacy//////
    const add = await prisma.pharmacy_assign.create({
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
          title:"order received",
          body:"New order received.....❗",
          // sound: "msgsound"
        },
        token:fcmToken,
        
      }
    
    try{
      await secondApp.messaging().send(message)
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


//////add token for pharmacy/////
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
        // Generate a random 6-digit number
        const otp = Math.floor(10000 + Math.random() * 900000);
        return otp.toString();
      }

      const randomOTP = generateOTP();
      console.log(randomOTP);
      const add_temOtp = await prisma.pharmacy_details.updateMany({
        where:{
          email:email
        },
        data:{
          temp_otp:parseInt(randomOTP)
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
      `Internal server error: ${error.message} in chemist-forgot_password API`
    );
    console.error(error);
    return response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}

/////check otp////
const verifyOtp = async(req,res)=>{
  try{
    const {pharmacyId,otp} = req.body
    if(pharmacyId && otp){
    const verify = await prisma.pharmacy_details.findUnique({
      where:{
        id:pharmacyId,
        temp_otp:otp
      }
    })
    console.log({verify})
    if(!verify){
      return res.status(200).json({
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
    return res.status(200).json({
      error:false,
      success:true,
      message:"Successfull...............",
      data:getNotification
    })
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



////get order summary(3 month)
// const orderSummery = async (req, res) => {
//   try {
//     const { chemistId } = req.body;

//     if (!chemistId) {
//       return res.status(400).json({ error: "Chemist ID is required" });
//     }

//     const getCurrentDateInIST = () => {
//       const now = new Date();
//       const offset = 330; // IST offset in minutes (UTC+5:30)
//       const localTime = new Date(now.getTime() + offset * 60 * 1000);
//       return localTime;
//     };

//     const listLastThreeMonths = (date) => {
//       const months = [];
//       for (let i = 0; i < 3; i++) {
//         const current = new Date(date);
//         current.setMonth(current.getMonth() - i); // Subtract i months
//         const year = current.getFullYear();
//         const month = current.getMonth() + 1; // Months are 0-indexed
//         const paddedMonth = month < 10 ? `0${month}` : month; // Format to two digits
//         months.push(`${year}-${paddedMonth}`);
//       }
//       return months;
//     };

//     const currentDate = getCurrentDateInIST();
//     const lastThreeMonths = listLastThreeMonths(currentDate);

//     console.log({ lastThreeMonths });

//     // Query the pharmacy_assign table
//     const orders = await prisma.pharmacy_assign.findMany({
//       where: {
//         pharmacy_id: chemistId,
//         status: "packed",
//         Stmodified_date: {
//           gte: new Date(`${lastThreeMonths[2]}-01`), // Start of the oldest month
//           lte: new Date(`${lastThreeMonths[0]}-31`), // End of the current month
//         },
//       },
//       orderBy: {
//         Stmodified_date: "asc",
//       },
//     });

//     console.log({ orders });

//     if (!orders.length) {
//       return res.status(404).json({ message: "No orders found for the last three months." });
//     }

//     const totalAmount = [];

//     for (let i = 0; i < orders.length; i++) {
//       const findPrice = await prisma.sales_order.findMany({
//         where: {
//           sales_id: orders[i].sales_id,
//         },
//         select: {
//           total_amount: true,
//         },
//       });

//       console.log({ findPrice });

//       if (findPrice.length > 0) {
//         const price = Number(findPrice[0].total_amount); // Ensure the amount is treated as a number
//         totalAmount.push(price);
//       }
//     }

//     // Calculate the grand total as a sum of totalAmounts
//     const grandTotal = totalAmount.reduce((acc, curr) => acc + curr, 0);

//     res.status(200).json({
//       success: true,
//       data: orders,
//       totalAmounts: totalAmount,
//       grandTotal: grandTotal,
//     });
//   } catch (error) {
//     console.error(`Internal server error: ${error.message} in chemist-orderSummery API`);
//     return res.status(500).json({ error: "Internal Server Error" });
//   } finally {
//     await prisma.$disconnect();
//   }
// };



// const orderSummery = async (req, res) => {
//   try {
//     const { chemistId, month } = req.body;

//     if (!chemistId) {
//       return res.status(400).json({ error: "Chemist ID is required" });
//     }

//     // Helper function to get the current date in IST
//     const getCurrentDateInIST = () => {
//       const now = new Date();
//       const offset = 330; // IST offset in minutes (UTC+5:30)
//       const localTime = new Date(now.getTime() + offset * 60 * 1000);
//       return localTime;
//     };

//     // Helper function to list the last three months
//     const listLastThreeMonths = (date) => {
//       const months = [];
//       for (let i = 0; i < 3; i++) {
//         const current = new Date(date);
//         current.setMonth(current.getMonth() - i); // Subtract i months
//         const year = current.getFullYear();
//         const month = current.getMonth() + 1; // Months are 0-indexed
//         const paddedMonth = month < 10 ? `0${month}` : month; // Format to two digits
//         months.push(`${year}-${paddedMonth}`);
//       }
//       return months;
//     };

//     let startDate, endDate;

//     if (month) {
//       // If `month` is provided, calculate start and end dates for the given month
//       const [inputMonth, inputYear] = month.split("/"); // e.g., "04/2024" -> ["04", "2024"]
//       startDate = new Date(`${inputYear}-${inputMonth}-01`); // Start of the month
//       endDate = new Date(startDate);
//       endDate.setMonth(startDate.getMonth() + 1); // Move to the next month
//       endDate.setDate(0); // Set to the last day of the current month
//     } else {
//       // If `month` is not provided, calculate for the last three months
//       const currentDate = getCurrentDateInIST();
//       const lastThreeMonths = listLastThreeMonths(currentDate);

//       // Set startDate as the start of the oldest month and endDate as the end of the current month
//       startDate = new Date(`${lastThreeMonths[2]}-01`); // Start of the oldest month
//       endDate = new Date(`${lastThreeMonths[0]}-31`); // End of the current month
//     }

//     console.log({ startDate, endDate });

//     // Query the pharmacy_assign table
//     const orders = await prisma.pharmacy_assign.findMany({
//       where: {
//         pharmacy_id: chemistId,
//         status: "packed",
//         Stmodified_date: {
//           gte: startDate, // Start date
//           lte: endDate, // End date
//         },
//       },
//       orderBy: {
//         Stmodified_date: "asc",
//       },
//     });

//     console.log({ orders });

//     if (!orders.length) {
//       const message = month
//         ? `No orders found for the month ${month}.`
//         : "No orders found for the last three months.";
//       return res.status(404).json({ message });
//     }

//     const totalAmount = [];

//     for (let i = 0; i < orders.length; i++) {
//       const findPrice = await prisma.sales_order.findMany({
//         where: {
//           sales_id: orders[i].sales_id,
//         },
//         select: {
//           total_amount: true,
//         },
//       });

//       console.log({ findPrice });

//       if (findPrice.length > 0) {
//         const price = Number(findPrice[0].total_amount); // Ensure the amount is treated as a number
//         totalAmount.push(price);
//       }
//     }

//     // Calculate the grand total as a sum of totalAmounts
//     const grandTotal = totalAmount.reduce((acc, curr) => acc + curr, 0);

//     res.status(200).json({
//       success: true,
//       data: orders,
//       totalAmounts: totalAmount,
//       grandTotal: grandTotal,
//     });
//   } catch (error) {
//     console.error(`Internal server error: ${error.message} in chemist-orderSummery API`);
//     return res.status(500).json({ error: "Internal Server Error" });
//   } finally {
//     await prisma.$disconnect();
//   }
// };

const orderSummery = async (req, res) => {
  try {
    const { chemistId, month } = req.body;

    if (!chemistId) {
      return res.status(400).json({ error: "Chemist ID is required" });
    }

    // Helper function to get the current date in IST
    const getCurrentDateInIST = () => {
      const now = new Date();
      const offset = 330; // IST offset in minutes (UTC+5:30)
      const localTime = new Date(now.getTime() + offset * 60 * 1000);
      return localTime;
    };

    let startDate, endDate;

    if (month) {
      // If `month` is provided, check for range format
      if (month.includes("-")) {
        // Handle range format "10/2024-12/2024"
        const [start, end] = month.split("-");
        const [startMonth, startYear] = start.split("/"); // e.g., "10/2024" -> ["10", "2024"]
        const [endMonth, endYear] = end.split("/"); // e.g., "12/2024" -> ["12", "2024"]

        startDate = new Date(`${startYear}-${startMonth}-01`); // Start of the range
        endDate = new Date(`${endYear}-${endMonth}-01`); // Start of the next month after the range
        endDate.setMonth(endDate.getMonth() + 1); // Move to the next month
        endDate.setDate(0); // Set to the last day of the given range
      } else {
        // Single month format "10/2024"
        const [inputMonth, inputYear] = month.split("/"); // e.g., "04/2024" -> ["04", "2024"]
        startDate = new Date(`${inputYear}-${inputMonth}-01`); // Start of the month
        endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + 1); // Move to the next month
        endDate.setDate(0); // Set to the last day of the current month
      }
    } else {
      // If `month` is not provided, calculate for the last three months
      const currentDate = getCurrentDateInIST();
      const currentMonth = currentDate.getMonth() + 1; // Current month (1-indexed)
      const currentYear = currentDate.getFullYear();

      startDate = new Date(currentYear, currentMonth - 3, 1); // Start of three months ago
      endDate = new Date(currentYear, currentMonth, 0); // End of the current month
    }

    console.log({ startDate, endDate });

    // Query the pharmacy_assign table
    const orders = await prisma.pharmacy_assign.findMany({
      where: {
        pharmacy_id: chemistId,
        status: "packed",
        Stmodified_date: {
          gte: startDate, // Start date
          lte: endDate, // End date
        },
      },
      orderBy: {
        Stmodified_date: "asc",
      },
    });

    console.log({ orders });

    if (!orders.length) {
      const message = month
        ? `No orders found for the month(s) ${month}.`
        : "No orders found for the last three months.";
      return res.status(404).json({ message });
    }

    const totalAmount = [];

    for (let i = 0; i < orders.length; i++) {
      const findPrice = await prisma.sales_order.findMany({
        where: {
          sales_id: orders[i].sales_id,
        },
        select: {
          total_amount: true,
        },
      });

      console.log({ findPrice });

      if (findPrice.length > 0) {
        const price = Number(findPrice[0].total_amount); // Ensure the amount is treated as a number
        totalAmount.push(price);
      }
    }

    // Calculate the grand total as a sum of totalAmounts
    const grandTotal = totalAmount.reduce((acc, curr) => acc + curr, 0);

    res.status(200).json({
      success: true,
      // data: orders,
      // totalAmounts: totalAmount,
      grandTotal: grandTotal,
    });
  } catch (error) {
    console.error(`Internal server error: ${error.message} in chemist-orderSummery API`);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};



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
    addSeenStatus,
    orderSummery,
    verifyOtp
}
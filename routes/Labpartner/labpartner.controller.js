const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {getCurrentDateInIST, encrypt, decrypt} = require('../../utils');
const bcrypt = require("bcrypt")

const labpartner_login = async (req, res) => {
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
          user = await prisma.lab_details.findFirst({
            where: {
              email: userid,
            },
          });
        } else {
          user = await prisma.lab_details.findFirst({
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
        // logger.error(
        //   `Internal server error: ${err.message} in labpartner_login api`
        // );
        console.log("error-----",err)
        res.status(400).json({
          error: true,
          message: "internal server error",
        });
      }
    }
  };


const labpartner_profile = async(req,res)=>{
  try{
    const {labId} = req.body
     if(!labId){
      return res.status(404).json({
        error:true,
        success:false,
        message:"lab id is required..........."
      })
     }
    const findLab = await prisma.lab_details.findUnique({
      where:{
        id:labId
      }
    })
    console.log({findLab})
   
    return res.status(200).json({
      error:false,
      success:true,
      message:"successfull.......",
      data:findLab
    })
  }catch (err) {
    console.log({err})
    // logger.error(
    //   `Internal server error: ${err.message} in labpartner_profile api`
    // );
    res.status(400).json({
      error: true,
      message: "internal server error",
    });
  }
}

const getOrder = async (req, res) => {
    try {
      const { labId } = req.body;
      const secretKey = process.env.ENCRYPTION_KEY;
      
      const safeDecrypt = (text, key) => {
        try {
          return decrypt(text, key);
        } catch (err) {
          return text;
        }
      };
      
      if (!labId) {
        return res.status(200).json({
          error: true,
          success: false,
          message: "lab ID is required.",
        });
      }
  
      const getCompleteOrder = await prisma.labtest_order.findMany({
        where: {
          lab_id: labId,
          status: "confirmed",
          
        },
        orderBy:{
          order_id:"asc"
        }
      });
      // console.log({getCompleteOrder})

      if (getCompleteOrder.length === 0) {
        return res.status(404).json({
          error: true,
          success: false,
          message: "No order found.",
        });
      }
  const order =[]
    for (let j = 0; j < getCompleteOrder.length; j++) {
          const customer_id = getCompleteOrder[j].customer_id;
          // console.log({customer_id})
        
       const getCustomerName = await prisma.user_details.findMany({
        where:{
          id:customer_id
        }
       })
      //  console.log({getCustomerName})
       const decryptedname = safeDecrypt(getCustomerName[0].name, secretKey);
       getCustomerName[0].name = decryptedname;
        // console.log({decryptedname})

        const find_test = await prisma.labtest_list.findMany({
          where:{
               order_id:getCompleteOrder[j].order_id
          }
        })
        // console.log({find_test})
        const test =[]
        for(let i=0; i<find_test.length;i++){
        const testNumber =find_test[i].test_number
        console.log({testNumber})

        let testData = [];
        if (testNumber.startsWith("t")) {
          testData = await prisma.labtest_details.findMany({
              where: { test_number: testNumber }
          });
      } else{
          testData = await prisma.lab_packages.findMany({
              where: { test_number: testNumber }
          });
      }
          console.log({testData})
          test.push({testData})
      }

        order.push({
          ...getCompleteOrder[j],
         user : decryptedname,
         test_details:test
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

const orderResponse = async(req,res)=>{
  try{
    const {orderId,status} = req.body
    const date = getCurrentDateInIST()
   if(orderId && status){
    const addResponse = await prisma.labtest_order.update({
      where:{
        order_id:orderId
      },
      data:{
        status:status,
        updated_date:date
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
    console.log({err})
    // logger.error(
    //   `Internal server error: ${err.message} in getorder api`
    // );
    res.status(400).json({
      error: true,
      message: "internal server error",
    });
  }
}

const edit_profile = async(req,res)=>{
  try{
    const{labId,name,phone_no,email} = req.body
    const editData = await prisma.lab_details.update({
      where:{
        id:labId
      },
      data:{
        name,
        phone_no,
        email
      }
    })
    console.log({editData})
    res.status(200).json({
      error:false,
      success:true,
      message:"Successfullyy edited",
      data:editData
    })

  }catch (err) {
    console.log({err})
    // logger.error(
    //   `Internal server error: ${err.message} in edit_profile api`
    // );
    res.status(400).json({
      error: true,
      message: "internal server error",
    });
  }
}

const pastOrder = async(req,res)=>{
  try {
    const { labId } = req.body;
    const secretKey = process.env.ENCRYPTION_KEY;
    
    const safeDecrypt = (text, key) => {
      try {
        return decrypt(text, key);
      } catch (err) {
        return text;
      }
    };
    
    if (!labId) {
      return res.status(200).json({
        error: true,
        success: false,
        message: "lab ID is required.",
      });
    }

    const getCompleteOrder = await prisma.labtest_order.findMany({
      where: {
        lab_id: labId,
        status: "packed",
        
      },
      orderBy:{
        order_id:"desc"
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
const order =[]
  for (let j = 0; j < getCompleteOrder.length; j++) {
        const customer_id = getCompleteOrder[j].customer_id;
        // console.log({customer_id})
      
     const getCustomerName = await prisma.user_details.findMany({
      where:{
        id:customer_id
      }
     })
    //  console.log({getCustomerName})
     const decryptedname = safeDecrypt(getCustomerName[0].name, secretKey);
     getCustomerName[0].name = decryptedname;
      // console.log({decryptedname})

      const find_test = await prisma.labtest_list.findMany({
        where:{
             order_id:getCompleteOrder[j].order_id
        }
      })
      // console.log({find_test})
      const test =[]
      for(let i=0; i<find_test.length;i++){
      const testNumber =find_test[i].test_number
      console.log({testNumber})

      let testData = [];
      if (testNumber.startsWith("T")) {
        testData = await prisma.labtest_details.findMany({
            where: { test_number: testNumber }
        });
    } else{
        testData = await prisma.lab_packages.findMany({
            where: { test_number: testNumber }
        });
    }
        console.log({testData})
        test.push({testData})
    }

      order.push({
        ...getCompleteOrder[j],
       user : decryptedname,
       test_details:test
      });
    }
  

    res.status(200).json({
      error: false,
      success: true,
      message: "Successful",
      data: order,
    });
  }catch (err) {
    console.log({err})
    // logger.error(
    //   `Internal server error: ${err.message} in edit_profile api`
    // );
    res.status(400).json({
      error: true,
      message: "internal server error",
    });
  }
}


const product_list = async (req, res) => {
  try {
    const { labId } = req.body;

    if (!labId) {
      return res.status(200).json({
        error: true,
        success: false,
        message: "lab ID is required.",
      });
    }

    const findtest = await prisma.lab_details.findFirst({
      where: {
        id: labId,
      },
    });

    console.log({ findtest });

    if (!findtest) {
      return res.status(404).json({
        error: true,
        success: false,
        message: "Lab not found.",
      });
    }

    // Extract test_ids and package_id arrays
    const { test_ids, package_id } = findtest;

    console.log({ test_ids, package_id });

    // Fetch tests
    const getTests = await prisma.labtest_details.findMany({
      where: {
        id: { in: test_ids }, // Use 'in' operator for multiple values
      },
    });

    console.log({ getTests });

    // Fetch packages
    const getPackage = await prisma.lab_packages.findMany({
      where: {
        id: { in: package_id }, // Use 'in' operator for multiple values
      },
    });

    console.log({ getPackage });

    res.status(200).json({
      error: false,
      success: true,
      message: "Data fetched successfully.",
      tests: getTests,
      packages: getPackage,
    });

  } catch (err) {
    console.log({ err });
    res.status(400).json({
      error: true,
      message: "Internal server error",
    });
  }
};


module.exports ={labpartner_login,
    labpartner_profile,
    getOrder,
    orderResponse,
    edit_profile,
    pastOrder,
    product_list
}
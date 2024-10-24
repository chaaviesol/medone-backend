const {
  encrypt,
  decrypt,
  getCurrentDateInIST,
  istDate,
  logger,
  prisma,
} = require("../../utils");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const csv = require("csv-parser");
const fs = require("fs");

///////////csv-file/////////////////////
const csvupload = async (req, res) => {
  try {
    const fileRows = [];
    const fileRows2 = [];

    // Open uploaded file
    fs.createReadStream("../../Desktop/DOC1/hospitalfullcsv.csv")
      .pipe(csv())
      .on("data", (row, index) => {
        if (!row.hospitalName) {
          return;
        }

        fileRows.push(row);
      })
      .on("end", async () => {
        // Remove temporary file
        // fs.unlinkSync("./malappuramData.csv")
        // for (i = 0; i <= fileRows.length; i++) {
        //   // if (i <= 5) {
        //     fileRows2.push(fileRows[i]);
        //   // }
        // }
        // console.log(fileRows);

        try {
          await insertData(fileRows);
          res.send("File successfully processed and data inserted.");
        } catch (error) {
          res.status(500).send("Error inserting data: " + error.message);
        }
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  } finally {
    await prisma.$disconnect();
  }
};
/////////doc case//////
// async function insertData(data) {
//   try {
//     const doctorDetailsData = data.map(row => ({
//       name: row.firstname,
//       second_name:row.lastname,
//       phone_no:row.phone_number,
//       email:row.Email_Id,
//       password,
//       education_qualification:row.sp1,
//       additional_qualification:row.specialty,
//       specialization: row.specialty,
//       type:row.Type,
//       gender:row.gender,
//       address:row.address,
//       experience:row.experience,
//       registration_no:row.Registrationnumber,
//       pincode:row.PINCODE,
//       sector:row.SECTOR
//       // Map other columns from your CSV file to your database fields
//     }));
//     await prisma.doctor_details.createMany({
//       data: doctorDetailsData,
//     });
//   } catch (e) {
//     throw e;
//   }
// }

//////////to manually encrypt existing data in db

// const csvupload = async (req, res) => {
//   try {
//     const fileRows = [];
//     const fileRows2 = [];

//     const filePath = "C:\\Users\\dell\\Desktop\\DOC1\\LabCompletecsv.csv";
//     // const filePath = "C:\\Users\\dell\\Desktop\\DOC1\\hospitalfullcsv.csv";

//     // Check if file exists
//     if (!fs.existsSync(filePath)) {
//       return res.status(404).send("File not found: " + filePath);
//     }

//     console.log("Starting file read...");

//     fs.createReadStream(filePath)
//       .on("error", (error) => {
//         console.error("Error reading file:", error);
//         return res.status(500).send("Error reading file: " + error.message);
//       })
//       .pipe(csv())
//       .on("data", (row) => {
//         console.log("Reading row:", row);
//         if (row.name) {
//           fileRows.push(row);
//         }
//       })
//       .on("end", async () => {
//         console.log("Finished reading file. Total rows:", fileRows.length);

//         // for (let i = 0; i < fileRows.length && i < 5; i++) {
//         //   fileRows2.push(fileRows[i]);
//         // }

//         // console.log("First 5 rows:", fileRows2);

//         try {
//           await insertData(fileRows);
//           res.send("File successfully processed and data inserted.");
//         } catch (error) {
//           res.status(500).send("Error inserting data: " + error.message);
//         }
//       });
//   } catch (error) {
//     console.error("Caught error:", error);
//     return res.status(500).json({
//       error: true,
//       message: "Internal Server Error",
//     });
//   } finally {
//     await prisma.$disconnect();
//   }
// };

// async function insertData(data) {
//   const features = [];
//   const services = [];
//   const labservices1 = [
//     "PET",
//     "MRI",
//     "CT",
//     "USG",
//     "Xrays",
//     "ECG",
//     "Medical Microbiology",
//     "Clinical Biochemistry",
//     "Hematology",
//     "Clinical Pathology",
//     "Genetic Testing",
//     "Kidney Tests",
//     "Prenatal Testing",
//   ];
//   const labservices2 = [
//     "CT",
//     "USG",
//     "Xrays",
//     "ECG",
//     "Medical Microbiology",
//     "Clinical Biochemistry",
//     "Hematology",
//     "Clinical Pathology",
//     "Kidney Tests",
//   ];
//   const labfeatures1 = [
//     "Home collection",
//     "Onilne report",
//     "Cashless",
//     "24 hours services",
//     "Doctor available",
//   ];
//   const labfeatures2 = ["Home collection", "Onilne report"];
//   const labtiming = {
//     closing_time: "06:00 PM",
//     opening_time: "06:00 AM",
//   };
//   const images = {
//     image1:
//       "https://dr1-storage.s3.ap-south-1.amazonaws.com/1722360588969-labimg1.jpg",
//     image2:
//       "https://dr1-storage.s3.ap-south-1.amazonaws.com/1722360589079-labimg2.jpg",
//     image3:
//       "https://dr1-storage.s3.ap-south-1.amazonaws.com/1722360589819-labimg3.jpg",
//     image4:
//       "https://dr1-storage.s3.ap-south-1.amazonaws.com/1722360590510-labimg4.jpg",
//   };

//   try {
//     const labDetailsData = await Promise.all(
//       data.map(async (row) => ({
//         name: row.name,
//         phone_no: row.ContactNumber,
//         email: row.emailid,
//         password: await bcrypt.hash(`Password@${row.ContactNumber}`, 10),
//         address: row.Address,
//         license_no: row.license_no,
//         pincode: row.Pincode,
//         services: row.type === "A" ? labservices1 : labservices2,
//         features: row.type === "A" ? labfeatures1 : labfeatures2,
//         datetime: istDate,
//         status: "Y",
//         photo: images,
//         timing: labtiming,
//       }))
//     );

//     await prisma.lab_details.createMany({
//       data: labDetailsData,
//     });
//     console.log("Data insertion successful");
//   } catch (e) {
//     console.error("Error in insertData function:", e);
//     throw e;
//   }
// }

//hospitalcase///////////////

async function insertData(data) {
  const labservices = [
    "Blood Count Tests",
    "Kidney Tests",
    "Laboratory Tests",
    "Thyroid Tests",
    "Bilirubin Test",
    "Cholesterol Level",
    "Electrocardiogram",
    "TempCheck",
  ];
  const labfeatures = [
    "Home collection",
    "Onilne report",
    "Cashless",
    "24 hours services",
    "Doctor available",
  ];
  const hospitalfeature = [
    "Op",
    "Casuality",
    "Palliative",
    "Care",
    "Other Services ",
  ];
  const hospitalspeciality = ["General medicine"];
  const labtiming={
    "closing_time": "06:00 PM",
    "opening_time": "06:00 AM"
  }
  try {
    const hospitalDetailsData = await Promise.all(
      data.map(async (row) => ({
        name: row.hospitalName,
        contact_no: row.MobileNo,
        email: row.Email_id,
        password: await bcrypt.hash(`Password@${row.MobileNo}`, 10),
        speciality: hospitalspeciality,
        type: row.Type,
        address: row.newaddress,
        licence_no: row.license_no,
        pincode: parseInt(row.Pincode),
        feature: hospitalfeature,
        datetime: istDate,
        status: "Y",
      }))
    );

    await prisma.hospital_details.createMany({
      data: hospitalDetailsData,
    });
    console.log("Data insertion successful");
  } catch (e) {
    console.error("Error in insertData function:", e);
    throw e;
  }
}

/////////doc case///////
// async function insertData(data) {
//   try {
//     const doctorDetailsData = await Promise.all(
//       data.map(async (row) => ({
//         name: `DR ${row.firstname}`,
//         second_name: row.lastname,
//         phone_no: row.phone_number,
//         email: row.Email_Id,
//         password: await bcrypt.hash(`Password@${row.phone_number}`, 10),
//         education_qualification: row.sp1,
//         additional_qualification: row.speciality,
//         specialization: row.speciality,
//         type: row.Type,
//         gender: row.gender,
//         address: row.address ? `${row.address},${row.area}` : row.area,
//         experience: parseInt(row.experience),
//         registration_no: row.Registrationnumber,
//         pincode: parseInt(row.PINCODE),
//         sector: row.SECTOR,
//         datetime: istDate,
//         status: "Y",
//       }))
//     );

//     await prisma.doctor_details.createMany({
//       data: doctorDetailsData,
//     });
//   } catch (e) {
//     throw e;
//   }
// }

/////////////////////////////////////////////////////////////

const addUsers = async (request, response) => {
  const secretKey = process.env.ENCRYPTION_KEY;
  const safeDecrypt = (text, key) => {
    try {
      return decrypt(text, key);
    } catch (err) {
      return text;
    }
  };
  try {
    const {
      name: name,
      phone_no: phone_no,
      email: email,
      password: password,
    } = request.body;
    if (name && password && email && phone_no) {
      const mobileNumber = phone_no;
      if (validateMobileNumber(mobileNumber)) {
        console.log("Valid mobile number");
      } else {
        console.log("Invalid mobile number");
        const resptext = "Invalid mobile number";
        return response.status(401).json({
          error: true,
          success: false,
          message: resptext,
        });
      }
      function validateMobileNumber(mobileNumber) {
        // Regular expression for a valid 10-digit Indian mobile number
        const mobileNumberRegex = /^[6-9]\d{9}$/;
        return mobileNumberRegex.test(mobileNumber);
      }

      const email_id = email;
      if (validateEmail(email_id)) {
        console.log("Valid email address");
      } else {
        console.log("Invalid email address");
        const resptext = "Invalid email address";
        return response.status(401).json({
          error: true,
          success: false,
          message: resptext,
        });
      }
      function validateEmail(email_id) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return emailRegex.test(email_id);
      }
      const users = await prisma.user_details.findMany();
      const emaillowercase = email.toLowerCase();
      for (const user of users) {
        const decryptedEmail = safeDecrypt(user.email, secretKey);
        const decryptedPhone = safeDecrypt(user.phone_no, secretKey);

        if (decryptedEmail === email || decryptedEmail === emaillowercase) {
          return response.status(400).json({
            error: true,
            message: "Email address already exists",
            success: false,
          });
        } else if (decryptedPhone === phone_no) {
          return response.status(400).json({
            error: true,
            message: "Phone number already exists",
            success: false,
          });
        }
      }
      const datetime = getCurrentDateInIST();
      const hashedPass = await bcrypt.hash(password, 5);
      const emailencrypted = encrypt(emaillowercase, secretKey);
      const phoneencrypted = encrypt(phone_no, secretKey);
      await prisma.user_details.create({
        data: {
          name: encrypt(name, secretKey),
          password: hashedPass,
          email: emailencrypted,
          datetime: datetime,
          phone_no: phoneencrypted,
          status: "Y",
        },
      });
      const respText = "Registered successfully";
      response.status(200).json({
        success: true,
        message: respText,
      });
    } else {
      logger.error(`All fields are mandatory in addUsers api`);
      response.status(500).json("All fields are mandatory");
    }
  } catch (error) {
    console.log(error);
    logger.error(`Internal server error: ${error.message} in addUsers api`);
    response.status(500).json("An error occurred");
  } finally {
    await prisma.$disconnect();
  }
};

const completeRegistration = async (request, response) => {
  try {
    const secretKey = process.env.ENCRYPTION_KEY;
    const user_id = request.user.userId;
    const userimg = request.file?.location;

    const { ageGroup, gender, pincode } = JSON.parse(request.body.data);
    if (user_id && ageGroup && gender && pincode) {
      const user = await prisma.user_details.findFirst({
        where: {
          id: user_id,
        },
      });
      if (!user) {
        const resptext = "User doesn't exist";
        return response.status(400).json({
          error: true,
          message: resptext,
        });
      } else {
        const datetime = getCurrentDateInIST();
        const encryptedagegroup = encrypt(ageGroup, secretKey);
        const encryptedgender = encrypt(gender, secretKey);
        await prisma.user_details.update({
          where: {
            id: user_id,
          },
          data: {
            ageGroup: encryptedagegroup,
            gender: encryptedgender,
            pincode,
            updatedDate: datetime,
            image: userimg,
          },
        });
        const respText = "User updated";
        response.status(201).json({
          error: false,
          success: true,
          message: respText,
        });
      }
    } else {
      logger.error(`All fields are mandatory in completeRegistration api`);
      response.status(500).json("All fields are mandatory");
    }
  } catch (error) {
    console.log(error);
    logger.error(
      `Internal server error: ${error.message} in completeRegistration api`
    );
    response.status(500).json("An error occurred");
  } finally {
    await prisma.$disconnect();
  }
};

const userLogin = async (request, response) => {
  console.log("userloginnnn");
  const { email, password } = request.body;
  const safeDecrypt = (text, key) => {
    try {
      return decrypt(text, key);
    } catch (err) {
      return text;
    }
  };
  const secretKey = process.env.ENCRYPTION_KEY;
  const datetime = getCurrentDateInIST();

  if (!email || !password) {
    return response.status(401).json({
      error: true,
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    const emaillower = email.toLowerCase();
    const email_id = emaillower;
    if (validateEmail(email_id)) {
      console.log("Valid email address");
    } else {
      console.log("Invalid email address");
      const resptext = "Invalid email address";
      return response.status(401).json({
        error: true,
        success: false,
        message: resptext,
      });
    }
    function validateEmail(email_id) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      return emailRegex.test(email_id);
    }
    const users = await prisma.user_details.findMany({
      select:{
        id:true,
        email:true,
        password:true
      }
    });
    let user = null;

    for (const dbUser of users) {
      let decryptedEmail;
      try {
        decryptedEmail = safeDecrypt(dbUser.email, secretKey);
      } catch (error) {
        console.warn(
          `Skipping user ID ${dbUser.id} due to decryption error`,
          error
        );
        continue;
      }

      if (decryptedEmail === emaillower) {
        user = dbUser;
        break;
      }
    }

    if (!user) {
      return response.status(401).json({
        error: true,
        success: false,
        message: "User does not exist",
      });
    }

    const logged_id = user.id;
    const userType = "customer";
    const hashedDbPassword = user.password;

    // Compare the provided password with the hashed password from the database
    bcrypt.compare(password, hashedDbPassword, async (error, result) => {
      if (error) {
        return response.status(500).json({
          error: true,
          success: false,
          message: "Password hashing error",
        });
      }

      if (!result) {
        return response.status(401).json({
          error: true,
          success: false,
          message: "Please check your password!",
        });
      }
      const refreshTokenPayload = {
        userId: logged_id,
        userType,
      };

      const accessTokenPayload = {
        userId: logged_id,
        userType,
      };

      const refreshTokenOptions = {
        expiresIn: "900m",
      };

      const accessTokenOptions = {
        expiresIn: "100m",
      };

      const refreshToken = jwt.sign(
        refreshTokenPayload,
        process.env.REFRESH_TOKEN_SECRET,
        refreshTokenOptions
      );

      const accessToken = jwt.sign(
        accessTokenPayload,
        process.env.ACCESS_TOKEN_SECRET,
        accessTokenOptions
      );

      await prisma.user_details.update({
        where: { id: logged_id },
        data: { last_active: datetime },
      });

      return response.status(200).json({
        success: true,
        error: false,
        message: "Login successful", //message: "Login successful
        refreshToken,
        accessToken,
        userId: logged_id,
        userType,
      });
    });
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in userLogin API`);
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const getusers = async (request, response) => {
  const secretKey = process.env.ENCRYPTION_KEY;
  const safeDecrypt = (text, key) => {
    try {
      return decrypt(text, key);
    } catch (err) {
      return text;
    }
  };

  try {
    const allData = await prisma.user_details.findMany({
      select: {
        id: true,
        name: true,
        phone_no: true,
        email: true,
        datetime: true,
        pincode: true,
        ageGroup: true,
        gender: true,
        last_active: true,
        status: true,
        image: true,
      },
    });

    let allcompletedcount = 0;
    if (allData.length > 0) {
      // Decrypt fields for each user
      const decryptedData = allData.map((user) => {
        const decryptedUser = {
          ...user,
          id: user.id,
          ageGroup: safeDecrypt(user.ageGroup, secretKey),
          name: safeDecrypt(user.name, secretKey),
          email: safeDecrypt(user.email, secretKey),
          phone_no: safeDecrypt(user.phone_no, secretKey),
          gender: safeDecrypt(user.gender, secretKey),
        };

        if (user.ageGroup) {
          allcompletedcount++;
        }

        return decryptedUser;
      });

      return response.status(200).json({
        success: true,
        error: false,
        data: decryptedData,
        allregisteredcount:decryptedData.length,
        allcompletedcount: allcompletedcount,
      });
    } else {
      return response.status(200).json({
        success: false,
        error: true,
        message: "No Data",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    logger.error(`Internal server error: ${error.message} in getusers API`);
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  } finally {
    await prisma.$disconnect();
  }
};



const edituser = async (request, response) => {
  const secretKey = process.env.ENCRYPTION_KEY;

  try {
    const id = request.user.userId;
    const userimg = request.file?.location || request.body.image;
    console.log(userimg);
    const { name, ageGroup, gender, pincode } = JSON.parse(request.body.data);
    if (id) {
      const userdata = await prisma.user_details.findUnique({
        where: {
          id: id,
        },
      });
      const decryptedName = decrypt(userdata.name, secretKey);
      let decryptedAgeGroup;
      if (userdata.ageGroup) {
        decryptedAgeGroup = decrypt(userdata?.ageGroup, secretKey);
      }
      let decryptedGender;
      if (userdata?.gender) {
        decryptedGender = decrypt(userdata?.gender, secretKey);
      }

      const isNameChanged = decryptedName !== name;
      const isAgeGroupChanged = decryptedAgeGroup !== ageGroup;
      const isGenderChanged = decryptedGender !== gender;
      const isPincodeChanged = userdata.pincode !== pincode;
      const isImageChanged = userdata.image !== userimg;

      if (
        !isNameChanged &&
        !isAgeGroupChanged &&
        !isGenderChanged &&
        !isPincodeChanged &&
        !isImageChanged
      ) {
        return response.status(201).json({
          message: "No changes detected",
          success: false,
          error: true,
        });
      }
      const datetime = getCurrentDateInIST();
      const encryptedname = encrypt(name, secretKey);
      const encryptedagegroup = encrypt(ageGroup, secretKey);
      const encryptedgender = encrypt(gender, secretKey);
      const update = await prisma.user_details.updateMany({
        where: {
          id: id,
        },
        data: {
          name: encryptedname,
          ageGroup: encryptedagegroup,
          gender: encryptedgender,
          pincode: pincode,
          updatedDate: datetime,
          image: userimg,
        },
      });
      if (update) {
        response.status(200).json({
          message: "successfully updated",
          success: true,
          error: false,
        });
      }
    }
  } catch (error) {
    console.log("errr", error);
    logger.error(`Internal server error: ${error.message} in edituser api`);
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  } finally {
    await prisma.$disconnect();
  }
};



















module.exports = {
  addUsers,
  userLogin,
  getusers,
  edituser,
  completeRegistration,
  csvupload,
};